import re

with open('MasterCard.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add chevron SVG to UI
chevron_svgs = """  chevronL: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>,
  chevronR: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>,"""
content = content.replace('check: <svg viewBox="0 0 24 24"', chevron_svgs + '\n  check: <svg viewBox="0 0 24 24"')

# 2. Extract job mapping body
start_marker = "{JOBS_DATA.map((job) => ("
end_marker = "      ))}\n\n      {/* Footer Paginator space */}"

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx == -1 or end_idx == -1:
    print("Could not find start or end markers for JOBS_DATA.map")
    exit(1)

map_body = content[start_idx:end_idx + len("      ))}")]

# Extract cards securely
card1_start = map_body.find("{/* 1. CLIENT INFORMATION */}")
card2_start = map_body.find("{/* 2. COMPANY INFORMATION */}")
card3_start = map_body.find("{/* 3. TECHNICIAN INFORMATION */}")
card4_start = map_body.find("{/* 4. JOB TRACKER */}")
card5_start = map_body.find("{/* 5. PRO FORMA INVOICE (Miniature) */}")
card5_end = map_body.rfind("</div>", card5_start)
card5_end = map_body.rfind("</div>", 0, card5_end) # find the second to last div in the block, actually easier is just to take up to the grid end

# The structure is:
# <div className="mc-cards-grid">
#   Card 1
#   Card 2
#   Card 3
#   Card 4
#   Card 5
# </div>

card1 = map_body[card1_start:card2_start].strip()
card2 = map_body[card2_start:card3_start].strip()
card3 = map_body[card3_start:card4_start].strip()
card4 = map_body[card4_start:card5_start].strip()

# for card 5 end, the safest marker is the closing of mc-cards-grid.
cards_grid_end = map_body.find("          </div>\n        </div>", card5_start)
card5 = map_body[card5_start:cards_grid_end].strip()

job_row_component = """
function JobRow({ job, setActiveModal }) {
  const [screen, setScreen] = useState(1);
  const nextScreen = () => setScreen(s => s < 3 ? s + 1 : 1);
  const prevScreen = () => setScreen(s => s > 1 ? s - 1 : 3);

  return (
    <div style={{ marginBottom: 20 }}>
      {/* Row Header */}
      <div className="mc-row-header" style={{ paddingLeft: 8, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div className="mcr-title" style={{ color: '#002147', fontSize: 16, letterSpacing: 0.5, marginRight: 8 }}>{job.id}</div>
          <div className="mcr-badge" style={{ color: job.sColor, background: job.sColor + '10', borderColor: job.sColor + '30', padding: '4px 12px', fontWeight: 700, borderRadius: 20 }}>
            <span className="mcr-dot" style={{ background: job.sColor }}></span>
            {job.status}
          </div>
          <div style={{ display: 'flex', gap: 16, fontSize: 10.5, color: '#475569', fontWeight: 600 }}>
            <span style={{ background: '#f1f5f9', padding: '4px 12px', borderRadius: 16, border: '1px solid #e2e8f0' }}>Created At: <b style={{ color: '#1e293b' }}>{job.created}</b></span>
            <span style={{ background: '#f1f5f9', padding: '4px 12px', borderRadius: 16, border: '1px solid #e2e8f0' }}>Last Updated: <b style={{ color: '#1e293b' }}>{job.updated}</b></span>
          </div>
        </div>

        {/* Carousel Pagination Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginRight: 8 }}>
          <button onClick={prevScreen} style={{ border: '1px solid #cbd5e1', background: '#fff', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#475569' }}>
            {UI.chevronL}
          </button>
          
          <div style={{ display: 'flex', gap: 6 }}>
            {[1, 2, 3].map(st => (
              <span key={st} style={{ width: 8, height: 8, borderRadius: '50%', background: screen === st ? '#002147' : '#cbd5e1', cursor: 'pointer', transition: '0.2s' }} onClick={() => setScreen(st)} />
            ))}
          </div>
          
          <button onClick={nextScreen} style={{ border: '1px solid #cbd5e1', background: '#fff', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#475569' }}>
            {UI.chevronR}
          </button>
        </div>
      </div>

      {/* Cards Carousel Wrapper */}
      <div className="mc-carousel-wrap">
        <div className="mc-carousel-inner" style={{ transform: `translateX(-${(screen - 1) * 33.3333}%)` }}>
          
          {/* SCREEN 1 */}
          <div className="mc-carousel-screen" style={{ width: '33.3333%', flexShrink: 0, display: 'flex', gap: 8, padding: 2 }}>
            <div style={{flex: 1, display: 'flex'}}>
              _CARD1_
            </div>
            <div style={{flex: 1, display: 'flex'}}>
              _CARD2_
            </div>
          </div>

          {/* SCREEN 2 */}
          <div className="mc-carousel-screen" style={{ width: '33.3333%', flexShrink: 0, display: 'flex', gap: 8, padding: 2 }}>
            <div style={{flex: 1, display: 'flex'}}>
              _CARD3_
            </div>
            <div style={{flex: 1, display: 'flex'}}>
              _CARD4_
            </div>
          </div>

          {/* SCREEN 3 */}
          <div className="mc-carousel-screen" style={{ width: '33.3333%', flexShrink: 0, display: 'flex', gap: 8, padding: 2 }}>
            <div style={{flex: 1, display: 'flex'}}>
              _CARD5_
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
"""

job_row_component = job_row_component.replace("_CARD1_", card1)
job_row_component = job_row_component.replace("_CARD2_", card2)
job_row_component = job_row_component.replace("_CARD3_", card3)
job_row_component = job_row_component.replace("_CARD4_", card4)
job_row_component = job_row_component.replace("_CARD5_", card5)

new_map_str = "{JOBS_DATA.map((job) => (\n        <JobRow key={job.id} job={job} setActiveModal={setActiveModal} />\n      ))}"

content = content.replace(map_body, new_map_str)

# Prepend the JobRow component before MasterCard
comp_signature = "export default function MasterCard() {"
content = content.replace(comp_signature, job_row_component + "\n\n/* ════════════════════════════════════════\n   MAIN COMPONENT\n════════════════════════════════════════ */\n" + comp_signature)

# Overwrite
with open('MasterCard.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done refactoring MasterCard.jsx")
