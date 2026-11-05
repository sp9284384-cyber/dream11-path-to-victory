# generate_final_docs.py
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

def set_cell_background(cell, fill_hex):
    tcPr = cell._element.get_or_add_tcPr()
    shd = OxmlElement('w:shd')
    shd.set(qn('w:val'), 'clear')
    shd.set(qn('w:color'), 'auto')
    shd.set(qn('w:fill'), fill_hex)
    tcPr.append(shd)

def create_artifact_doc():
    doc = docx.Document()
    
    # 0.8 inch margins for clean professional layout
    for section in doc.sections:
        section.top_margin = Inches(0.8)
        section.bottom_margin = Inches(0.8)
        section.left_margin = Inches(0.8)
        section.right_margin = Inches(0.8)

    # Title
    title = doc.add_paragraph()
    r_title = title.add_run("Dream11 – Forward Deployed Engineer Intern")
    r_title.bold = True
    r_title.font.size = Pt(20)
    r_title.font.color.rgb = RGBColor(214, 35, 42) # Dream11 Brand Red

    subtitle = doc.add_paragraph()
    r_sub = subtitle.add_run("Working Artifact Submission: Path to Victory")
    r_sub.bold = True
    r_sub.font.size = Pt(13)
    r_sub.font.color.rgb = RGBColor(60, 60, 60)

    # Candidate Info
    p_meta = doc.add_paragraph()
    p_meta.add_run("Candidate: ").bold = True
    p_meta.add_run("Sunny  |  ")
    p_meta.add_run("Role: ").bold = True
    p_meta.add_run("Forward Deployed Engineer Intern  |  ")
    p_meta.add_run("Date: ").bold = True
    p_meta.add_run("November 2026")

    # Links Box
    table = doc.add_table(rows=1, cols=1)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    cell = table.cell(0, 0)
    set_cell_background(cell, "FBF8F5")
    cell.width = Inches(6.8)
    
    p_box = cell.paragraphs[0]
    p_box.paragraph_format.space_before = Pt(8)
    p_box.paragraph_format.space_after = Pt(8)
    
    r1 = p_box.add_run("🚀 Live Working Artifact Link:\n")
    r1.bold = True
    r1.font.size = Pt(11)
    
    r_url = p_box.add_run("https://dream11-path-to-victory.vercel.app\n\n")
    r_url.bold = True
    r_url.font.size = Pt(12)
    r_url.font.color.rgb = RGBColor(214, 35, 42)
    
    r2 = p_box.add_run("📂 Source Code & CI/CD Pipeline (GitHub):\n")
    r2.bold = True
    r2.font.size = Pt(11)
    
    r_git = p_box.add_run("https://github.com/sp9284384-cyber/dream11-path-to-victory")
    r_git.font.size = Pt(11)
    r_git.font.color.rgb = RGBColor(21, 127, 59)

    doc.add_paragraph().paragraph_format.space_after = Pt(4)

    # Section 1: Overview
    h1 = doc.add_heading(level=1)
    r_h1 = h1.add_run("1. Executive Summary & Problem Solved")
    r_h1.font.color.rgb = RGBColor(214, 35, 42)
    
    doc.add_paragraph(
        "During live sports broadcasts, fantasy fans face a major UX bottleneck: once a match starts, their lineup "
        "is locked. Traditional fantasy interfaces display passive leaderboards and point tallies, leaving fans anxious and "
        "forced into mental arithmetic. Fans struggle to understand: (1) what just happened to their roster, (2) why their "
        "rank moved, and (3) what specific play must happen next for them to win."
    )
    doc.add_paragraph(
        "\"Path to Victory\" solves this by bridging live sports scorecards (via SerpAPI Google Sports) with a deterministic "
        "scoring engine. It translates real-time deficits into plain-English guidance and lock-screen notification previews, "
        "informing fans exactly which player, boundary, or wicket will propel them to #1."
    )

    # Section 2: Instructions for Evaluators
    h2 = doc.add_heading(level=1)
    r_h2 = h2.add_run("2. Interactive Demo & Live Verification Guide")
    r_h2.font.color.rgb = RGBColor(214, 35, 42)

    doc.add_paragraph("Evaluators can test the prototype in multiple ways directly on the live web link:")
    
    p_step1 = doc.add_paragraph(style='List Bullet')
    p_step1.add_run("Live SerpAPI Google Sports Connection: ").bold = True
    p_step1.add_run(
        "Click on 'Live (SerpAPI)' and press 'Pull Live Sport Data'. The system fetches real international scorecards "
        "(e.g., India vs New Zealand cricket scorecard or Premier League football). "
        "Click 'Explain with AI' to trigger Google AI Studio (Gemini) narrative synthesis."
    )

    p_step2 = doc.add_paragraph(style='List Bullet')
    p_step2.add_run("Ball-by-Ball Match Simulation: ").bold = True
    p_step2.add_run(
        "Under 'Demo Match', step through real match events using 'Next Ball Event'. Watch the deterministic fantasy engine "
        "recalculate standings, captain multipliers (2×), and vice-captain multipliers (1.5×) in real time."
    )

    p_step3 = doc.add_paragraph(style='List Bullet')
    p_step3.add_run("Multi-Sport UI Adapter: ").bold = True
    p_step3.add_run(
        "Switch dynamically between Cricket, Football, Basketball, and Kabaddi. All UI sections, terminology, "
        "and Dream11 scoring matrices adapt immediately."
    )

    # Section 3: Engineering Architecture
    h3 = doc.add_heading(level=1)
    r_h3 = h3.add_run("3. System Architecture & Engineering Principles")
    r_h3.font.color.rgb = RGBColor(214, 35, 42)

    p_arch1 = doc.add_paragraph(style='List Bullet')
    p_arch1.add_run("Strict Boundary on LLMs: ").bold = True
    p_arch1.add_run("Points and ranks are calculated deterministically. The LLM is restricted strictly to linguistic wording.")

    p_arch2 = doc.add_paragraph(style='List Bullet')
    p_arch2.add_run("Zero-Hallucination Guard: ").bold = True
    p_arch2.add_run("A client-side regex validator audits all numbers in the AI response against computed facts, rejecting hallucinations.")

    p_arch3 = doc.add_paragraph(style='List Bullet')
    p_arch3.add_run("Production CI/CD: ").bold = True
    p_arch3.add_run("Full GitHub Actions pipeline performing linting, secret-leak scans, and automated Vercel deployments.")

    output_path = r"C:\Users\sunny\Desktop\dream11\dream11-path-to-victory\Dream11_Working_Artifact_Sunny.docx"
    doc.save(output_path)
    print("✓ Created:", output_path)

def create_short_note_doc():
    doc = docx.Document()
    
    for section in doc.sections:
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(1.0)

    # Header
    title = doc.add_paragraph()
    r_title = title.add_run("Dream11 FDE Intern Assignment – Short Note")
    r_title.bold = True
    r_title.font.size = Pt(17)
    r_title.font.color.rgb = RGBColor(214, 35, 42)

    p_meta = doc.add_paragraph()
    p_meta.add_run("Candidate: ").bold = True
    p_meta.add_run("Sunny  |  ")
    p_meta.add_run("Role: ").bold = True
    p_meta.add_run("Forward Deployed Engineer Intern  |  ")
    p_meta.add_run("Project: ").bold = True
    p_meta.add_run("Path to Victory")

    p_badge = doc.add_paragraph()
    r_b = p_badge.add_run("Word Count: 178 words (Strictly under the 200-word limit)")
    r_b.italic = True
    r_b.font.size = Pt(9.5)
    r_b.font.color.rgb = RGBColor(100, 100, 100)

    doc.add_paragraph().paragraph_format.space_after = Pt(2)

    # Question 1
    h1 = doc.add_heading(level=2)
    r_h1 = h1.add_run("1. What fan problem are you solving?")
    r_h1.font.size = Pt(12)
    r_h1.font.color.rgb = RGBColor(214, 35, 42)
    
    p1 = doc.add_paragraph()
    p1.add_run(
        "Once the first ball is bowled, a fantasy user's eleven is locked. During the live broadcast, fantasy apps confront fans with a dense leaderboard of shifting ranks and raw totals. Fans face immense cognitive fatigue trying to calculate multi-player permutations: they cannot decipher why their standing fluctuated or what exact on-field turn of events is needed for them to reach first place."
    )

    # Question 2
    h2 = doc.add_heading(level=2)
    r_h2 = h2.add_run("2. How does your solution help?")
    r_h2.font.size = Pt(12)
    r_h2.font.color.rgb = RGBColor(214, 35, 42)
    
    p2 = doc.add_paragraph()
    p2.add_run(
        "\"Path to Victory\" pairs real-time match telemetry with a deterministic rules engine. It models deficit thresholds against locked player multipliers (Captain 2×, VC 1.5×) and translates numerical states into three concise, conversational sentences:\n"
        "• The specific play that just shifted your tally.\n"
        "• Your live standing and distance to the summit.\n"
        "• The exact bowler, batter, or milestone to cheer for next to claim rank #1.\n"
        "A client-side verification gate audits all numeric tokens against calculated facts, preventing model hallucination."
    )

    # Question 3
    h3 = doc.add_heading(level=2)
    r_h3 = h3.add_run("3. Which AI tools did you use?")
    r_h3.font.size = Pt(12)
    r_h3.font.color.rgb = RGBColor(214, 35, 42)
    
    p3 = doc.add_paragraph()
    p3.add_run(
        "• Google AI Studio (Gemini Flash Lite): Structured semantic synthesis bounded strictly by computed JSON payloads.\n"
        "• SerpAPI Google Sports: Normalized ball-by-ball and match telemetry across multiple sports.\n"
        "• Vercel Edge & GitHub Actions CI/CD: Automated linting, security scanning, and sub-second delivery."
    )

    # Artifact Link Box
    table = doc.add_table(rows=1, cols=1)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    cell = table.cell(0, 0)
    set_cell_background(cell, "FBF8F5")
    cell.width = Inches(6.5)
    
    p_box = cell.paragraphs[0]
    p_box.paragraph_format.space_before = Pt(4)
    p_box.paragraph_format.space_after = Pt(4)
    
    r_lk = p_box.add_run("Working Artifact URL: ")
    r_lk.bold = True
    r_u = p_box.add_run("https://dream11-path-to-victory.vercel.app\n")
    r_u.font.color.rgb = RGBColor(214, 35, 42)
    r_u.bold = True
    
    r_gk = p_box.add_run("GitHub Source: ")
    r_gk.bold = True
    p_box.add_run("https://github.com/sp9284384-cyber/dream11-path-to-victory")

    output_path = r"C:\Users\sunny\Desktop\dream11\dream11-path-to-victory\Dream11_Short_Note_Sunny.docx"
    doc.save(output_path)
    print("✓ Created:", output_path)

if __name__ == "__main__":
    create_artifact_doc()
    create_short_note_doc()
