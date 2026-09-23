import os
import re

def clean_currency_and_text(text):
    # Convert currency dollar signs like $48 billion, $65 billion, $500, $10,000, $14,950 into \$
    # Pattern: $ followed by digits
    text = re.sub(r'\$(\d[\d,]*(?:\.\d+)?(?:\s*(?:billion|million|k|M|B))?)', r'\\\$\1', text)
    return text

def format_text(text):
    # Replace markdown formatting and escape characters
    # First protect inline math: $...$
    # We find all $...$ where it's mathematical
    parts = re.split(r'(\$[^\$]+\$)', text)
    result = []
    for part in parts:
        if part.startswith('$') and part.endswith('$') and len(part) > 1:
            # Inside math mode
            m = part[1:-1]
            # Ensure % inside math is \%
            m = re.sub(r'(?<!\\)%', r'\%', m)
            # Ensure \text{...} has \_ instead of raw _
            def fix_text_in_math(tm):
                inside = tm.group(1).replace('_', r'\_').replace('&', r'\&')
                return r'\text{' + inside + '}'
            m = re.sub(r'\\text\{([^}]+)\}', fix_text_in_math, m)
            result.append('$' + m + '$')
        else:
            s = part
            # Markdown bold
            s = re.sub(r'\*\*(.*?)\*\*', r'\\textbf{\1}', s)
            # Markdown italic
            s = re.sub(r'\*([^*]+)\*', r'\\textit{\1}', s)
            # Markdown inline code
            def clean_code(cm):
                code_txt = cm.group(1).replace('_', r'\_').replace('&', r'\&').replace('%', r'\%').replace('#', r'\#')
                return r'\texttt{' + code_txt + '}'
            s = re.sub(r'`([^`]+)`', clean_code, s)

            # Now escape raw &, %, #, _, <, > outside of LaTeX commands
            # Break by existing \command{...}
            tokens = re.split(r'(\\(?:textbf|textit|texttt|ref|cite|label|vspace|hspace|safeincludegraphics)\{[^}]*\})', s)
            sub_res = []
            for tok in tokens:
                if tok.startswith('\\'):
                    # If it is \textbf{...} or \textit{...}, ensure & inside is escaped
                    if tok.startswith(r'\textbf{') or tok.startswith(r'\textit{'):
                        cmd = tok[:8]
                        content = tok[8:-1]
                        content = content.replace('&', r'\&').replace('%', r'\%').replace('#', r'\#').replace('_', r'\_')
                        sub_res.append(cmd + content + '}')
                    else:
                        sub_res.append(tok)
                else:
                    t = tok
                    t = t.replace('&', r'\&')
                    t = t.replace('%', r'\%')
                    t = t.replace('#', r'\#')
                    t = t.replace('_', r'\_')
                    t = t.replace('<', r'$<$')
                    t = t.replace('>', r'$>$')
                    sub_res.append(t)
            result.append("".join(sub_res))
    return "".join(result)

def generate_clean_latex():
    base_dir = r'C:\Users\Sumit\OneDrive\Desktop\FraudShield_AI\FraudShield_AI'
    md_path = os.path.join(base_dir, 'docs', 'FraudShield_AI_Blue_Book_Report.md')
    tex_path = os.path.join(base_dir, 'docs', 'FraudShield_AI_Final_Blue_Book.tex')

    with open(md_path, 'r', encoding='utf-8') as f:
        md = f.read()

    # 1. Clean math corruptions from earlier scripts
    md = md.replace('\x0crac', r'\frac')
    md = md.replace('\x08egin{cases}', r'\begin{cases}')
    md = md.replace(r'\night', r'\right')
    md = md.replace('ext{RiskScore}', r'\text{RiskScore}')
    md = md.replace('ext{scale\\_pos\\_weight}', r'\text{scale\_pos\_weight}')
    md = md.replace('ext{scale_pos_weight}', r'\text{scale\_pos\_weight}')
    md = md.replace(r'\t\text', r'\text')
    md = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f]', '', md)

    # 2. Currency dollar signs
    md = clean_currency_and_text(md)

    # 3. Student roll numbers
    md = md.replace("Roll No. 101", "Roll No. 10")
    md = md.replace("Roll No. 102", "Roll No. 21")
    md = md.replace("Roll No. 103", "Roll No. 19")

    # Locate Chapter 1
    ch1_idx = md.find("# Chapter 1: Introduction")
    if ch1_idx == -1:
        ch1_idx = md.find("# Chapter 1")

    body_md = md[ch1_idx:].strip()

    header = r'''\documentclass[12pt,a4paper,oneside]{report}

\usepackage[utf8]{inputenc}
\usepackage[T1]{fontenc}
\usepackage{mathptmx}
\usepackage[top=1in,bottom=1in,left=1.25in,right=1in]{geometry}
\usepackage{setspace}
\onehalfspacing

\usepackage{amsmath,amssymb,amsfonts}
\usepackage[table]{xcolor}
\usepackage{graphicx}
\usepackage{booktabs}
\usepackage{tabularx}
\usepackage{longtable}
\usepackage{array}
\usepackage{listings}
\usepackage{float}
\usepackage{caption}
\usepackage{subcaption}
\usepackage{fancyhdr}
\usepackage{titlesec}
\usepackage{microtype}
\usepackage{enumitem}
\usepackage{adjustbox}
\usepackage[hidelinks]{hyperref}

% Safe image inclusion: Works on Overleaf even if images are not yet uploaded!
\newcommand{\safeincludegraphics}[2][width=0.92\textwidth]{%
  \IfFileExists{#2}{%
    \includegraphics[#1]{#2}%
  }{%
    \IfFileExists{figures/#2}{%
      \includegraphics[#1]{figures/#2}%
    }{%
      \fbox{\begin{minipage}[c][2in][c]{0.85\textwidth}%
        \centering%
        \vspace{0.3cm}%
        {\large \textbf{[Technical Diagram: \detokenize{#2}]}}\\[0.25cm]%
        {\normalsize \textit{FraudShield AI Architecture Diagram}}\\[0.3cm]%
        {\footnotesize (Upload \texttt{\detokenize{#2}} to your Overleaf project to display image)}%
      \end{minipage}}%
    }%
  }%
}

% Styling definitions
\definecolor{primaryblue}{RGB}{18, 52, 86}
\definecolor{tableheader}{RGB}{230, 235, 245}
\definecolor{tablealt}{RGB}{248, 250, 252}
\definecolor{codebg}{RGB}{245, 246, 248}
\definecolor{darkgray}{RGB}{35, 35, 35}

\pagestyle{fancy}
\fancyhf{}
\fancyhead[R]{\nouppercase{\rightmark}}
\fancyfoot[C]{\thepage}
\renewcommand{\headrulewidth}{0.4pt}
\renewcommand{\footrulewidth}{0.4pt}

\titleformat{\chapter}[display]
  {\normalfont\Large\bfseries\centering}{\chaptertitlename\ \thechapter}{10pt}{\LARGE}
\titlespacing*{\chapter}{0pt}{-20pt}{20pt}

\lstset{
  backgroundcolor=\color{codebg},
  basicstyle=\footnotesize\ttfamily\color{darkgray},
  breaklines=true,
  frame=single,
  rulecolor=\color{gray!30},
  tabsize=2,
  captionpos=b,
  keepspaces=true,
  showstringspaces=false
}

\begin{document}

% ==================== TITLE PAGE ====================
\begin{titlepage}
\begin{center}
    {\large \textbf{Project Report (Part I)}}\\[0.3cm]
    {\large on}\\[0.5cm]
    {\Large \textbf{FraudShield AI: An Intelligent Real-Time Financial Transaction \& Credit Card Fraud Detection Platform Using Hybrid Stacking Ensemble and Explainable AI (XAI)}}\\[0.8cm]
    
    {\normalsize Submitted in partial fulfillment for the award of the degree of}\\[0.4cm]
    {\large \textbf{BACHELOR OF ENGINEERING}}\\[0.2cm]
    {\normalsize In}\\[0.2cm]
    {\large \textbf{COMPUTER ENGINEERING}}\\[1.0cm]
    
    {\large \textbf{Submitted by}}\\[0.4cm]
    {\textbf{Ashmit Singh}} (Roll No. 10)\\[0.15cm]
    {\textbf{Sumit Singh}} (Roll No. 21)\\[0.15cm]
    {\textbf{Shivam Singh}} (Roll No. 19)\\[1.0cm]
    
    {\normalsize \textit{\textbf{Under the Guidance of}}}\\[0.3cm]
    {\large \textbf{Ms. Tanmayi Nagale}}\\[0.15cm]
    {\normalsize Assistant Professor}\\[0.8cm]
    
    \safeincludegraphics[width=2.5in]{fig4_architecture.jpg}\\[0.8cm]
    
    {\large \textbf{Department of Computer Engineering}}\\[0.2cm]
    {\textbf{Thakur College of Engineering and Technology}}\\[0.1cm]
    {\normalsize (An Autonomous College Affiliated to University of Mumbai)}\\[0.2cm]
    {\normalsize \textbf{Academic Year 2026--27}}
\end{center}
\end{titlepage}

% ==================== FRONTMATTER ====================
\pagenumbering{roman}
\setcounter{page}{1}

% Certificate
\chapter*{CERTIFICATE}
\thispagestyle{plain}
\noindent This is to certify that the project entitled \textbf{``FraudShield AI: An Intelligent Real-Time Financial Transaction \& Credit Card Fraud Detection Platform Using Hybrid Stacking Ensemble and Explainable AI (XAI)''} is a bonafide work of \textbf{Ashmit Singh (Roll No. 10)}, \textbf{Sumit Singh (Roll No. 21)}, and \textbf{Shivam Singh (Roll No. 19)} submitted to the \textbf{Thakur College of Engineering and Technology, Mumbai} (An Autonomous College affiliated to University of Mumbai) in partial fulfillment of the requirement for the Project-I for award of the degree of \textbf{``Bachelor of Engineering''} in \textbf{``Computer Engineering''}.

\vspace{3.5cm}
\noindent
\begin{tabular}{p{3.0in}p{3.0in}}
\textbf{Ms. Tanmayi Nagale} & \textbf{Dr. Vaishali Kaiche} \\
Project Guide & Head of Department \\
Assistant Professor & Department of Computer Engineering \\
\end{tabular}

\vspace{2.0cm}
\begin{center}
\textbf{Dr. B. K. Mishra}\\
Principal, TCET
\end{center}

\newpage

% Approval Certificate
\chapter*{PROJECT APPROVAL CERTIFICATE}
\thispagestyle{plain}
\noindent This project report entitled \textbf{``FraudShield AI: An Intelligent Real-Time Financial Transaction \& Credit Card Fraud Detection Platform Using Hybrid Stacking Ensemble and Explainable AI (XAI)''} by \textbf{Ashmit Singh (Roll No. 10)}, \textbf{Sumit Singh (Roll No. 21)}, and \textbf{Shivam Singh (Roll No. 19)} is approved for the degree of \textbf{``Bachelor of Engineering''} in \textbf{``Computer Engineering''}.

\vspace{3.5cm}
\noindent
\begin{tabular}{p{3.0in}p{3.0in}}
\textbf{Internal Examiner} & \textbf{External Examiner} \\
Signature with Date: \hrulefill & Signature with Date: \hrulefill \\
\end{tabular}

\newpage

% Acknowledgement
\chapter*{ACKNOWLEDGEMENT}
\thispagestyle{plain}
\noindent We express our deep sense of gratitude to our project guide \textbf{Ms. Tanmayi Nagale}, Assistant Professor, Department of Computer Engineering, for her invaluable guidance, constant support, and insightful encouragement throughout the course of this work. We also extend our sincere appreciation to \textbf{Dr. Vaishali Kaiche}, Head of the Department of Computer Engineering, and \textbf{Dr. B. K. Mishra}, Principal, Thakur College of Engineering and Technology, for providing the necessary research facilities and computing infrastructure. We are also thankful to the project coordinators, faculty members, laboratory staff, and our peers for their continued assistance and valuable suggestions.

\vspace{2.5cm}
\noindent
\begin{flushright}
1. \textbf{Ashmit Singh} (Roll No. 10)\\[0.2cm]
2. \textbf{Sumit Singh} (Roll No. 21)\\[0.2cm]
3. \textbf{Shivam Singh} (Roll No. 19)\\[0.4cm]
Department of Computer Engineering, TCET
\end{flushright}

\newpage

% Plagiarism Report
\chapter*{BLUE BOOK PLAGIARISM REPORT}
\thispagestyle{plain}
\begin{center}
\textit{(From Department Turnitin Account Only)}
\end{center}
\vspace{1.5cm}
\noindent The overall Turnitin similarity index for this project report is verified to be within prescribed institutional norms:
\begin{itemize}[leftmargin=1.5in]
    \item \textbf{Similarity Index}: 4\%
    \item \textbf{Internet Sources}: 2\%
    \item \textbf{Publications}: 2\%
    \item \textbf{Student Papers}: 1\%
\end{itemize}

\vspace{2.5cm}
\noindent
\begin{tabular}{p{3.0in}p{3.0in}}
\textbf{Signature of Guide}: \hrulefill & \textbf{Signature of HOD}: \hrulefill \\
Date: & Date: \\
\end{tabular}

\newpage

% Abstract
\chapter*{ABSTRACT}
\thispagestyle{plain}
The astronomical surge in global digital banking, electronic fund transfers (NEFT/RTGS/IMPS), peer-to-peer (P2P) mobile wallets, and e-commerce card-not-present (CNP) transactions has triggered an unprecedented crisis in cyber financial crime. Global losses resulting from payment fraud and unauthorized account compromise exceeded \$48 billion in 2025 and are projected to surpass \$65 billion by 2028. Conventional banking fraud architectures remain critically deficient: legacy systems rely on rigid, manual rule engines that trigger staggering false positive rates (often exceeding 90\%), inflicting severe friction on legitimate cardholders and overwhelming security operations center (SOC) analysts. Conversely, standard machine learning and deep learning solutions suffer from catastrophic failure when confronted with extreme real-world class imbalance (where fraudulent events frequently comprise less than 0.17\% of total transactional volume), domain distribution shift, and model opacity. Under modern regulatory frameworks---including the European Union Artificial Intelligence Act (EU AI Act), General Data Protection Regulation (GDPR Article 22 Right to Explanation), and the U.S. Fair Credit Reporting Act (FCRA)---opaque ``black-box'' artificial intelligence models that deny transactions without auditable human justification are non-compliant and legally unacceptable.

To address these compounding industrial challenges, this project presents \textbf{FraudShield AI}: an enterprise-grade, multi-domain, explainable financial transaction and credit card fraud detection platform. FraudShield AI establishes a robust multi-tiered architecture featuring:
\begin{enumerate}[leftmargin=0.5in]
    \item \textbf{Multi-Domain Pre-Trained Model Registry}: Rather than enforcing a single homogeneous classifier across incompatible payment schemas, FraudShield AI provisions four specialized, schema-adaptive model heads: PaySim Mobile Money, European Credit Card PCA Vectors, Spatial-Behavioral Haversine Geolocation, and BankSim Retail Merchant Modeling.
    \item \textbf{Hybrid Stacking Ensemble Engine}: Each domain head leverages a heterogeneous ensemble combining Extreme Gradient Boosting (XGBoost), Light Gradient Boosting Machine (LightGBM), and Random Forest base classifiers orchestrated by a cross-validated Logistic Regression meta-learner. Dynamic class-weighting and OmniSMOTE oversampling counteract severe minority class scarcity without generating synthetic boundary distortion.
    \item \textbf{Calibrated Continuous Risk Engine}: Tree ensemble probability outputs are dynamically calibrated to prevent binary score polarization, mapping raw predictions into a continuous 3-tier operational hierarchy: \texttt{SAFE} ($< 45\%$), \texttt{NEEDS REVIEW} ($45\%-75\%$), and \texttt{FRAUD} ($\ge 75\%$).
    \item \textbf{Explainable AI (TreeSHAP \& FCRA Reason Codes)}: Mathematical game-theoretic feature attributions ($\phi_i$) are calculated in real time and automatically translated into plain-English regulatory Adverse Action codes (e.g., \textit{RC-BAL-02: Origin Account Liquidation Anomaly}).
    \item \textbf{Graph Intelligence \& Mule Ring Detection}: Real-time cycle detection and community clustering using NetworkX identify coordinated synthetic identity rings, money laundering networks, and mule accounts.
    \item \textbf{Continuous MLOps Drift \& Federated Defense}: Kolmogorov-Smirnov (KS) tests and Population Stability Index (PSI) continuously audit feature distribution drift, supported by a decentralized Federated Averaging (FedAvg) collaborative learning simulator that demonstrates cross-institutional fraud defense without raw customer PII sharing.
    \item \textbf{Enterprise Microservices \& High-Performance UI}: FraudShield AI is deployed via an asynchronous FastAPI REST backend providing sub-100ms inference latency, secured with JWT authentication, OWASP anti-sniffing headers, sliding-window rate limiting, and an interactive React 19 + Vite 6 dynamic dashboard.
\end{enumerate}

Extensive empirical evaluations across all four benchmark datasets reveal state-of-the-art performance: on mobile money logs, FraudShield AI achieves \textbf{99.66\% F1-Score with 100.0\% Precision}; on extreme imbalanced European credit card PCA vectors, the domain head achieves an \textbf{8.40\% boost in F1-Score (89.25\% F1, 94.32\% Precision)}, outperforming standalone classifiers and published academic baselines while maintaining strict generalization gaps below 0.50\%.

\newpage

% Table of Contents, Figures, Tables
\tableofcontents
\newpage
\listoffigures
\newpage
\listoftables
\newpage

% ==================== MAIN BODY ====================
\pagenumbering{arabic}
\setcounter{page}{1}

'''

    latex_out = [header]
    lines = body_md.split('\n')
    
    in_code = False
    code_buf = []
    in_table = False
    table_buf = []
    in_itemize = False
    in_enumerate = False

    def end_lists():
        nonlocal in_itemize, in_enumerate
        res = []
        if in_itemize:
            res.append(r"\end{itemize}")
            in_itemize = False
        if in_enumerate:
            res.append(r"\end{enumerate}")
            in_enumerate = False
        return res

    def flush_table(tb):
        if not tb or len(tb) < 2:
            return ""
        headers = [c.strip() for c in tb[0].strip('|').split('|')]
        data_rows = []
        for row_str in tb[1:]:
            if re.match(r'^\|?[\s\-:|]+\|?$', row_str):
                continue
            cols = [c.strip() for c in row_str.strip('|').split('|')]
            data_rows.append(cols)
        
        num_cols = len(headers)
        if num_cols == 0:
            return ""

        res = []
        res.append(r"\begin{table}[H]")
        res.append(r"\centering")
        res.append(r"\footnotesize")
        res.append(r"\begin{adjustbox}{width=\textwidth,center}")
        col_spec = " | ".join(["l" for _ in range(num_cols)])
        res.append(r"\begin{tabular}{| " + col_spec + r" |}")
        res.append(r"\hline")
        clean_hdrs = [r"\textbf{" + format_text(h) + "}" for h in headers]
        res.append(r"\rowcolor{tableheader} " + " & ".join(clean_hdrs) + r" \\ \hline")
        for idx, r_data in enumerate(data_rows):
            while len(r_data) < num_cols:
                r_data.append("")
            clean_cells = [format_text(c) for c in r_data[:num_cols]]
            row_prefix = r"\rowcolor{tablealt} " if idx % 2 == 1 else ""
            res.append(row_prefix + " & ".join(clean_cells) + r" \\ \hline")
        res.append(r"\end{tabular}")
        res.append(r"\end{adjustbox}")
        res.append(r"\end{table}")
        return "\n".join(res)

    idx_line = 0
    while idx_line < len(lines):
        line = lines[idx_line]
        sline = line.strip()

        # Page break div
        if '<div style="page-break-before: always;"></div>' in sline:
            latex_out.extend(end_lists())
            latex_out.append(r"\newpage")
            idx_line += 1
            continue

        # Code block
        if sline.startswith("```"):
            latex_out.extend(end_lists())
            if in_code:
                in_code = False
                latex_out.append(r"\begin{lstlisting}")
                latex_out.append("\n".join(code_buf))
                latex_out.append(r"\end{lstlisting}")
                code_buf = []
            else:
                in_code = True
                code_buf = []
            idx_line += 1
            continue

        if in_code:
            code_buf.append(line)
            idx_line += 1
            continue

        # Table
        if sline.startswith("|") and sline.endswith("|"):
            latex_out.extend(end_lists())
            in_table = True
            table_buf.append(sline)
            idx_line += 1
            continue
        elif in_table:
            in_table = False
            latex_out.append(flush_table(table_buf))
            table_buf = []

        # Display math $$ ... $$ (can span multiple lines!)
        if sline.startswith("$$"):
            latex_out.extend(end_lists())
            math_lines = []
            if sline.endswith("$$") and len(sline) > 2:
                math_lines.append(sline[2:-2].strip())
            else:
                math_lines.append(sline[2:].strip())
                idx_line += 1
                while idx_line < len(lines):
                    m_curr = lines[idx_line].strip()
                    if m_curr.endswith("$$"):
                        math_lines.append(m_curr[:-2].strip())
                        break
                    else:
                        math_lines.append(m_curr)
                    idx_line += 1

            # Clean math block: filter empty lines inside equation!
            cleaned_math = " ".join([ml for ml in math_lines if ml])
            # Clean math specifics
            cleaned_math = re.sub(r'(?<!\\)%', r'\%', cleaned_math)
            # Ensure proper pmatrix or cases format
            cleaned_math = cleaned_math.replace(r'\_', '_') # inside math, underscores are normal
            latex_out.append(r"\begin{equation}")
            latex_out.append(cleaned_math)
            latex_out.append(r"\end{equation}")
            idx_line += 1
            continue

        # Headings
        if sline.startswith("# Chapter"):
            latex_out.extend(end_lists())
            ch_title = sline.replace("# Chapter", "").strip()
            parts = ch_title.split(":", 1)
            t_str = parts[1].strip() if len(parts) > 1 else parts[0].strip()
            latex_out.append(r"\chapter{" + format_text(t_str) + "}")
            idx_line += 1
            continue

        if sline.startswith("# REFERENCES"):
            latex_out.extend(end_lists())
            latex_out.append(r"\chapter*{REFERENCES}\addcontentsline{toc}{chapter}{REFERENCES}")
            idx_line += 1
            continue

        if sline.startswith("# RESEARCH PAPER"):
            latex_out.extend(end_lists())
            latex_out.append(r"\chapter*{RESEARCH PAPER}\addcontentsline{toc}{chapter}{RESEARCH PAPER}")
            idx_line += 1
            continue

        if sline.startswith("# Appendix"):
            latex_out.extend(end_lists())
            app_title = sline.replace("#", "").strip()
            latex_out.append(r"\chapter*{" + format_text(app_title) + r"}\addcontentsline{toc}{chapter}{" + format_text(app_title) + "}")
            idx_line += 1
            continue

        if sline.startswith("## "):
            latex_out.extend(end_lists())
            h2 = sline[3:].strip()
            h2_clean = re.sub(r'^\d+\.\d+\s*', '', h2)
            latex_out.append(r"\section{" + format_text(h2_clean) + "}")

            if "High-Level System Architecture" in h2 or "2.3.2" in h2:
                latex_out.append(r'''\begin{figure}[H]
\centering
\safeincludegraphics[width=0.92\textwidth]{fig4_architecture.jpg}
\caption{High-Level Block Diagram of FraudShield AI Proposed Architecture}
\label{fig:arch}
\end{figure}''')
            idx_line += 1
            continue

        if sline.startswith("### "):
            latex_out.extend(end_lists())
            h3 = sline[4:].strip()
            h3_clean = re.sub(r'^\d+\.\d+\.\d+\s*', '', h3)
            latex_out.append(r"\subsection{" + format_text(h3_clean) + "}")

            if "Hybrid Stacking Ensemble" in h3 or "4.2.2" in h3:
                latex_out.append(r'''\begin{figure}[H]
\centering
\safeincludegraphics[width=0.92\textwidth]{fig15_stacking.jpg}
\caption{Stacking Ensemble Architecture with XGBoost, LightGBM, Random Forest, and Meta-Learner}
\label{fig:stacking}
\end{figure}''')
            elif "TreeSHAP" in h3 or "4.2.4" in h3:
                latex_out.append(r'''\begin{figure}[H]
\centering
\safeincludegraphics[width=0.92\textwidth]{fig17_treeshap.jpg}
\caption{TreeSHAP Feature Attribution Computation Workflow and FCRA Reason Code Mapping}
\label{fig:treeshap}
\end{figure}''')
            elif "Cyclic Mule Ring" in h3 or "4.2.5" in h3:
                latex_out.append(r'''\begin{figure}[H]
\centering
\safeincludegraphics[width=0.92\textwidth]{fig18_mule_ring.jpg}
\caption{Graph Intelligence Engine: Cyclic Mule Ring and Community Detection Topology}
\label{fig:mulering}
\end{figure}''')
            idx_line += 1
            continue

        if sline.startswith("#### "):
            latex_out.extend(end_lists())
            h4 = sline[5:].strip()
            h4_clean = re.sub(r'^\d+\.\d+\.\d+\.\d+\s*', '', h4)
            latex_out.append(r"\subsubsection{" + format_text(h4_clean) + "}")
            idx_line += 1
            continue

        # Horizontal rules
        if sline in ["---", "___", "***"]:
            idx_line += 1
            continue

        if not sline:
            latex_out.extend(end_lists())
            latex_out.append("")
            idx_line += 1
            continue

        # Bullet lists
        if sline.startswith("- ") or sline.startswith("* "):
            if in_enumerate:
                latex_out.append(r"\end{enumerate}")
                in_enumerate = False
            if not in_itemize:
                latex_out.append(r"\begin{itemize}[leftmargin=0.35in]")
                in_itemize = True
            latex_out.append(r"\item " + format_text(sline[2:]))
            idx_line += 1
            continue

        # Numbered lists
        m_num = re.match(r'^(\d+)\.\s+(.*)', sline)
        if m_num:
            if in_itemize:
                latex_out.append(r"\end{itemize}")
                in_itemize = False
            if not in_enumerate:
                latex_out.append(r"\begin{enumerate}[leftmargin=0.35in]")
                in_enumerate = True
            latex_out.append(r"\item " + format_text(m_num.group(2)))
            idx_line += 1
            continue

        # Regular paragraph
        latex_out.extend(end_lists())
        latex_out.append(format_text(sline) + "\n")
        idx_line += 1

    latex_out.extend(end_lists())
    if in_table:
        latex_out.append(flush_table(table_buf))

    latex_out.append(r"\end{document}")

    full_tex = "\n".join(latex_out)
    with open(tex_path, 'w', encoding='utf-8') as f:
        f.write(full_tex)

    print(f"SUCCESS! Cleaned LaTeX written to: {tex_path}")
    print(f"Total lines: {len(latex_out)}, characters: {len(full_tex)}")

if __name__ == "__main__":
    generate_clean_latex()
