import os
import sys
import argparse
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def setup_kaggle_credentials(username=None, key=None):
    kaggle_dir = os.path.expanduser('~/.kaggle')
    os.makedirs(kaggle_dir, exist_ok=True)
    json_path = os.path.join(kaggle_dir, 'kaggle.json')

    if username and key:
        import json
        with open(json_path, 'w') as f:
            json.dump({"username": username, "key": key}, f)
        os.chmod(json_path, 0o600)
        logging.info(f"Kaggle API credentials saved to {json_path}")
    elif os.path.exists(json_path):
        logging.info(f"Existing Kaggle API credentials found at {json_path}")
    else:
        logging.warning("No Kaggle credentials found. Set KAGGLE_USERNAME and KAGGLE_KEY or place kaggle.json in ~/.kaggle/")

def download_dataset(dataset_slug, output_dir='data/raw'):
    try:
        from kaggle.api.kaggle_api_extended import KaggleApi
        api = KaggleApi()
        api.authenticate()

        os.makedirs(output_dir, exist_ok=True)
        logging.info(f"Downloading Kaggle dataset '{dataset_slug}' to {output_dir}...")
        api.dataset_download_files(dataset_slug, path=output_dir, unzip=True)
        logging.info(f"Successfully downloaded and unzipped '{dataset_slug}' into {output_dir}!")
    except Exception as e:
        logging.error(f"Kaggle API download failed: {e}")
        logging.info("Instructions: Generate a Kaggle API Token at https://www.kaggle.com/settings -> 'Create New Token'")
        logging.info("Then run: python scripts/download_kaggle_dataset.py --dataset mlg-ulb/creditcardfraud --username YOUR_USERNAME --key YOUR_API_KEY")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Kaggle Dataset Downloader for FraudShield AI")
    parser.add_argument('--dataset', type=str, default='mlg-ulb/creditcardfraud', help='Kaggle dataset slug (e.g. mlg-ulb/creditcardfraud)')
    parser.add_argument('--output', type=str, default='data/raw', help='Output directory')
    parser.add_argument('--username', type=str, default=None, help='Kaggle Username')
    parser.add_argument('--key', type=str, default=None, help='Kaggle API Key')

    args = parser.parse_args()
    setup_kaggle_credentials(args.username, args.key)
    download_dataset(args.dataset, args.output)
