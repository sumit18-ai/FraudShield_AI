import os
import sys

# Add scripts directory to path
sys.path.append(os.path.dirname(__file__))

from generate_ch3 import get_chapter_3
from generate_ch4 import get_chapter_4
from generate_ch5_6_backmatter import get_chapter_5_6_backmatter

def build_full_report():
    docs_dir = os.path.join(os.path.dirname(__file__), "..", "docs")
    os.makedirs(docs_dir, exist_ok=True)
    
    report_md_path = os.path.join(docs_dir, "FraudShield_AI_Blue_Book_Report.md")
    
    # Read existing Front Matter, Chapter 1, and Chapter 2
    with open(report_md_path, "r", encoding="utf-8") as f:
        existing_content = f.read()
        
    # Append Chapters 3, 4, 5, 6, and Back Matter
    full_markdown = (
        existing_content.strip() + "\n\n" +
        get_chapter_3().strip() + "\n\n" +
        get_chapter_4().strip() + "\n\n" +
        get_chapter_5_6_backmatter().strip() + "\n"
    )
    
    # Write complete markdown
    with open(report_md_path, "w", encoding="utf-8") as f:
        f.write(full_markdown)
        
    print(f"Successfully generated full Markdown report: {report_md_path}")
    print(f"Total characters: {len(full_markdown)}, Total words: {len(full_markdown.split())}")
    
    # Also generate a styled, printable HTML document for instant PDF conversion or Word opening
    html_path = os.path.join(docs_dir, "FraudShield_AI_Blue_Book_Report.html")
    
    # Simple markdown to HTML converter for basic elements
    import re
    
    # Replace markdown headings
    html_body = full_markdown
    # Tables
    # Preserve pagebreaks
    html_body = html_body.replace('<div style="page-break-before: always;"></div>', '<div class="pagebreak"></div>')
    
    # Convert code blocks
    html_body = re.sub(r'```(.*?)```', r'<pre><code>\1</code></pre>', html_body, flags=re.DOTALL)
    
    html_template = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>FraudShield AI - Project Report (Part I) - TCET Blue Book</title>
<style>
  @page {{
    size: A4;
    margin: 1in 1in 1in 1.25in;
    @bottom-right {{
      content: counter(page);
    }}
  }}
  body {{
    font-family: "Times New Roman", Times, serif;
    font-size: 12pt;
    line-height: 1.5;
    color: #111;
    margin: 40px auto;
    max-width: 850px;
    text-align: justify;
  }}
  h1 {{
    font-size: 18pt;
    font-weight: bold;
    text-align: center;
    margin-top: 30px;
    margin-bottom: 20px;
  }}
  h2 {{
    font-size: 16pt;
    font-weight: bold;
    margin-top: 25px;
    margin-bottom: 15px;
    border-bottom: 1px solid #ccc;
    padding-bottom: 5px;
  }}
  h3 {{
    font-size: 14pt;
    font-weight: bold;
    margin-top: 20px;
    margin-bottom: 10px;
  }}
  h4 {{
    font-size: 12pt;
    font-weight: bold;
    margin-top: 15px;
    margin-bottom: 8px;
  }}
  p {{
    margin-bottom: 12px;
    text-indent: 0.3in;
  }}
  table {{
    width: 100%;
    border-collapse: collapse;
    margin: 20px 0;
    font-size: 11pt;
  }}
  th, td {{
    border: 1px solid #333;
    padding: 8px 10px;
    text-align: left;
  }}
  th {{
    background-color: #f2f2f2;
    font-weight: bold;
  }}
  pre {{
    background-color: #f8f9fa;
    border: 1px solid #ddd;
    padding: 12px;
    border-radius: 4px;
    font-family: "Courier New", Courier, monospace;
    font-size: 9.5pt;
    line-height: 1.3;
    overflow-x: auto;
    margin: 15px 0;
    white-space: pre-wrap;
  }}
  .pagebreak {{
    page-break-before: always;
    break-before: page;
    margin-top: 40px;
  }}
  .cover-page {{
    text-align: center;
    padding-top: 40px;
  }}
  .cover-page p {{
    text-indent: 0;
  }}
  ul, ol {{
    margin-bottom: 15px;
    padding-left: 30px;
  }}
  li {{
    margin-bottom: 6px;
  }}
  .alert {{
    border-left: 4px solid #0056b3;
    background-color: #eef6fc;
    padding: 10px 15px;
    margin: 15px 0;
    font-size: 11pt;
  }}
</style>
</head>
<body>
<div class="content">
{html_body}
</div>
</body>
</html>
"""
    with open(html_path, "w", encoding="utf-8") as f:
        f.write(html_template)
        
    print(f"Successfully generated styled printable HTML report: {html_path}")

if __name__ == "__main__":
    build_full_report()
