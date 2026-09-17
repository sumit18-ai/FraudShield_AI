import networkx as nx
import random
import time
from typing import Dict, List, Any, Tuple

class GraphIntelligenceEngine:
    def __init__(self):
        self.graph = nx.DiGraph()
        self.device_map = {}   # device_id -> set of account_ids
        self.ip_map = {}       # ip_address -> set of account_ids
        self.card_map = {}     # card_token -> set of account_ids
        self.node_attributes = {} # node_id -> {type, risk_score, flagged, history_count}
        self.known_fraud_rings = []
        self._initialize_seed_network()

    def _initialize_seed_network(self):
        """Initializes realistic baseline nodes and synthetic mule rings for demonstration."""
        seed_accounts = [f"C{100000 + i}" for i in range(25)]
        seed_merchants = [f"M{50000 + i}" for i in range(10)]
        
        # Add normal merchant connections
        for i in range(15):
            acc = seed_accounts[i]
            merch = seed_merchants[i % len(seed_merchants)]
            self.add_transaction({
                "nameOrig": acc,
                "nameDest": merch,
                "amount": random.uniform(25.0, 450.0),
                "type": "PAYMENT",
                "device_id": f"DEV_{100 + (i % 8)}",
                "ip_address": f"192.168.1.{10 + (i % 8)}",
                "isFraud": 0
            })

        # Inject Synthetic Fraud Ring 1: Circular Mule Network (A -> B -> C -> D -> A)
        mule_ring_1 = ["C90101", "C90102", "C90103", "C90104"]
        shared_dev_1 = "DEV_MULE_RING_X"
        shared_ip_1 = "45.134.22.9"
        
        for idx in range(len(mule_ring_1)):
            src = mule_ring_1[idx]
            dst = mule_ring_1[(idx + 1) % len(mule_ring_1)]
            self.add_transaction({
                "nameOrig": src,
                "nameDest": dst,
                "amount": random.uniform(85000.0, 190000.0),
                "type": "TRANSFER",
                "device_id": shared_dev_1,
                "ip_address": shared_ip_1,
                "isFraud": 1
            })

        # Inject Synthetic Fraud Ring 2: Star Mule Funnel (Many Victims -> One Aggregator -> Cashout)
        funnel_victims = ["C80101", "C80102", "C80103", "C80104"]
        mule_aggregator = "C80999"
        cashout_destination = "M80001"
        shared_ip_2 = "185.220.101.5"

        for vic in funnel_victims:
            self.add_transaction({
                "nameOrig": vic,
                "nameDest": mule_aggregator,
                "amount": random.uniform(40000.0, 95000.0),
                "type": "TRANSFER",
                "device_id": f"DEV_{random.randint(500, 520)}",
                "ip_address": shared_ip_2,
                "isFraud": 1
            })

        self.add_transaction({
            "nameOrig": mule_aggregator,
            "nameDest": cashout_destination,
            "amount": 310000.0,
            "type": "CASH_OUT",
            "device_id": "DEV_AGGREGATOR_01",
            "ip_address": shared_ip_2,
            "isFraud": 1
        })

    def add_transaction(self, txn: Dict[str, Any]):
        src = str(txn.get("nameOrig", "UNKNOWN_SRC"))
        dst = str(txn.get("nameDest", "UNKNOWN_DST"))
        amt = float(txn.get("amount", 0.0))
        tx_type = str(txn.get("type", "PAYMENT")).upper()
        is_fraud = int(txn.get("isFraud", 0))
        dev = txn.get("device_id") or txn.get("device") or f"DEV_AUTO_{abs(hash(src)) % 100}"
        ip = txn.get("ip_address") or txn.get("ip") or f"10.0.0.{abs(hash(src)) % 250}"

        # Update Graph Nodes
        if not self.graph.has_node(src):
            self.graph.add_node(src, entity_type="CUSTOMER", risk_score=0.05, flagged=False, tx_count=0)
        if not self.graph.has_node(dst):
            dst_type = "MERCHANT" if dst.startswith("M") else "CUSTOMER"
            self.graph.add_node(dst, entity_type=dst_type, risk_score=0.05, flagged=False, tx_count=0)

        # Update node activity count
        self.graph.nodes[src]["tx_count"] = self.graph.nodes[src].get("tx_count", 0) + 1
        self.graph.nodes[dst]["tx_count"] = self.graph.nodes[dst].get("tx_count", 0) + 1

        if is_fraud:
            self.graph.nodes[src]["flagged"] = True
            self.graph.nodes[src]["risk_score"] = max(self.graph.nodes[src].get("risk_score", 0.0), 0.85)
            self.graph.nodes[dst]["risk_score"] = max(self.graph.nodes[dst].get("risk_score", 0.0), 0.70)

        # Add directed edge with transaction weight
        if self.graph.has_edge(src, dst):
            self.graph[src][dst]["weight"] += 1
            self.graph[src][dst]["total_amount"] += amt
            self.graph[src][dst]["last_type"] = tx_type
        else:
            self.graph.add_edge(src, dst, weight=1, total_amount=amt, last_type=tx_type, device=dev, ip=ip)

        # Update entity maps for synthetic identity / shared attribute resolution
        self.device_map.setdefault(dev, set()).add(src)
        self.ip_map.setdefault(ip, set()).add(src)

    def calculate_graph_risk(self, sender: str, receiver: str, device: str = None, ip: str = None) -> Dict[str, Any]:
        """
        Calculates Graph Risk Score using:
        1. Cycle/Ring Participation
        2. Proximity to known flagged/fraud nodes
        3. Shared entity velocity (multiple accounts sharing same device/IP)
        4. Degree Centrality
        """
        reasons = []
        graph_risk = 0.05

        # Check 1: Shared Device / IP Velocity (Mule Ring indicator)
        if device and device in self.device_map:
            shared_accounts = self.device_map[device]
            if len(shared_accounts) >= 3:
                graph_risk += 0.35
                reasons.append(f"Device fingerprint '{device}' is shared across {len(shared_accounts)} distinct accounts (High-density entity clustering)")
            elif len(shared_accounts) >= 2:
                graph_risk += 0.15
                reasons.append(f"Device fingerprint '{device}' linked to multiple customer profiles")

        if ip and ip in self.ip_map:
            shared_ips = self.ip_map[ip]
            if len(shared_ips) >= 4:
                graph_risk += 0.25
                reasons.append(f"IP address '{ip}' generated transactions for {len(shared_ips)} accounts in close temporal proximity")

        # Check 2: Cycle Detection (Circular money laundering)
        try:
            if self.graph.has_node(sender) and self.graph.has_node(receiver):
                if nx.has_path(self.graph, receiver, sender):
                    # There exists a path back from receiver to sender -> potential cycle
                    shortest_back_path = nx.shortest_path(self.graph, receiver, sender)
                    cycle_len = len(shortest_back_path)
                    graph_risk += 0.40
                    reasons.append(f"Circular money flow detected: Direct/Indirect cycle between '{sender}' and '{receiver}' (Path length: {cycle_len})")
        except Exception:
            pass

        # Check 3: Proximity to Flagged Nodes
        if self.graph.has_node(receiver):
            recv_risk = self.graph.nodes[receiver].get("risk_score", 0.0)
            if recv_risk > 0.6:
                graph_risk += 0.30
                reasons.append(f"Recipient account '{receiver}' has a historical network suspicion index of {recv_risk:.2f}")

        if self.graph.has_node(sender):
            send_risk = self.graph.nodes[sender].get("risk_score", 0.0)
            if send_risk > 0.6:
                graph_risk += 0.25
                reasons.append(f"Sender account '{sender}' is closely linked to flagged fraud cluster")

        # Check 4: Degree Centrality Anomaly (Hub & Spoke mule aggregator)
        if self.graph.has_node(receiver):
            in_degree = self.graph.in_degree(receiver)
            if in_degree >= 5:
                graph_risk += 0.20
                reasons.append(f"Recipient '{receiver}' is acting as a high-inflow aggregator node ({in_degree} incoming edges)")

        normalized_risk = max(0.01, min(0.99, round(graph_risk, 4)))
        return {
            "graph_risk_score": normalized_risk,
            "in_fraud_ring": normalized_risk >= 0.60,
            "reasons": reasons if reasons else ["No anomalous network topological structures detected."]
        }

    def detect_all_fraud_rings(self) -> List[Dict[str, Any]]:
        """Identifies circular money laundering cycles and high-risk mule clusters across the graph."""
        detected_rings = []
        
        # 1. Detect Simple Directed Cycles (length 2 to 6)
        try:
            cycles = list(nx.simple_cycles(self.graph))
            for i, cycle in enumerate(cycles[:10]):
                if len(cycle) >= 2:
                    total_vol = 0.0
                    for u, v in zip(cycle, cycle[1:] + [cycle[0]]):
                        if self.graph.has_edge(u, v):
                            total_vol += self.graph[u][v].get("total_amount", 0.0)
                    
                    detected_rings.append({
                        "ring_id": f"RING-CYC-{i+1:03d}",
                        "type": "CIRCULAR_MULE_CYCLE",
                        "severity": "CRITICAL" if len(cycle) <= 4 else "HIGH",
                        "nodes": cycle,
                        "node_count": len(cycle),
                        "estimated_laundered_volume": round(total_vol, 2),
                        "description": f"Closed-loop money circulation involving {len(cycle)} interconnected accounts"
                    })
        except Exception:
            pass

        # 2. Detect Shared Device / Synthetic Identity Rings
        for dev, accs in self.device_map.items():
            if len(accs) >= 3:
                detected_rings.append({
                    "ring_id": f"RING-DEV-{abs(hash(dev)) % 1000:03d}",
                    "type": "SHARED_DEVICE_SYNDICATE",
                    "severity": "HIGH",
                    "nodes": list(accs),
                    "node_count": len(accs),
                    "shared_entity": dev,
                    "description": f"Syndicated entity cluster sharing hardware fingerprint '{dev}' across {len(accs)} identities"
                })

        return detected_rings

    def get_full_network_data(self) -> Dict[str, Any]:
        """Returns node and edge representations for frontend canvas / SVG visualization."""
        nodes = []
        for n, data in self.graph.nodes(data=True):
            in_deg = self.graph.in_degree(n)
            out_deg = self.graph.out_degree(n)
            risk = data.get("risk_score", 0.05)
            nodes.append({
                "id": str(n),
                "label": str(n),
                "type": data.get("entity_type", "CUSTOMER"),
                "risk_score": round(risk, 3),
                "flagged": data.get("flagged", False),
                "in_degree": in_deg,
                "out_degree": out_deg,
                "total_degree": in_deg + out_deg
            })

        edges = []
        for u, v, data in self.graph.edges(data=True):
            edges.append({
                "source": str(u),
                "target": str(v),
                "weight": data.get("weight", 1),
                "amount": round(data.get("total_amount", 0.0), 2),
                "type": data.get("last_type", "PAYMENT")
            })

        rings = self.detect_all_fraud_rings()

        return {
            "node_count": len(nodes),
            "edge_count": len(edges),
            "rings_detected_count": len(rings),
            "nodes": nodes,
            "edges": edges,
            "fraud_rings": rings
        }

# Global singleton
graph_engine = GraphIntelligenceEngine()
