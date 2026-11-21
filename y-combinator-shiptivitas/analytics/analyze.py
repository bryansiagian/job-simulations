"""Generate Shiptivitas Task 3 charts from the original SQLite database.
Run: python analyze.py (requires matplotlib; pip install matplotlib)
Input: shiptivity.db in the same directory.
"""
import sqlite3
from pathlib import Path
from datetime import date, timedelta
import matplotlib.pyplot as plt

ROOT = Path(__file__).resolve().parent
DB = ROOT / 'shiptivity.db'
OUT = ROOT / 'charts'
OUT.mkdir(exist_ok=True)

with sqlite3.connect(DB) as conn:
    daily_rows = conn.execute('''
        SELECT date(login_timestamp, 'unixepoch') day,
               COUNT(DISTINCT user_id) AS dau
        FROM login_history
        WHERE date(login_timestamp, 'unixepoch') BETWEEN '2018-05-26' AND '2018-06-08'
        GROUP BY day
    ''').fetchall()
    card_rows = conn.execute('''
        SELECT cardID, COUNT(*) AS n
        FROM card_change_history
        WHERE oldStatus IS NOT NULL AND oldStatus <> newStatus
        GROUP BY cardID
        ORDER BY n DESC, cardID ASC
    ''').fetchall()

by_day = dict(daily_rows)
start = date(2018, 5, 26)
days = [(start + timedelta(days=i)).isoformat() for i in range(14)]
values = [by_day.get(d, 0) for d in days]
before = sum(values[:7]) / 7
after = sum(values[7:]) / 7

fig, ax = plt.subplots(figsize=(10, 4.8))
ax.plot(range(14), values, marker='o')
ax.axvline(6.5, linestyle='--', linewidth=1.3, label='Kanban released: 2 Jun 2018')
ax.set_xticks(range(14), [d[5:] for d in days], rotation=45)
ax.set_ylabel('Unique active users')
ax.set_xlabel('Date (2018, UTC)')
ax.set_title(f'Daily active users | 7-day avg before {before:.2f}, after {after:.2f}')
ax.legend()
ax.grid(axis='y', alpha=0.25)
fig.tight_layout()
fig.savefig(OUT / 'dau_before_after.png', dpi=170)
plt.close(fig)

# Include all 200 cards, showing zeros so the distribution is complete.
status_count = dict(card_rows)
card_ids = range(1, 201)
fig, ax = plt.subplots(figsize=(13, 5))
ax.bar(card_ids, [status_count.get(i, 0) for i in card_ids], width=0.9)
ax.set_title('Actual status changes by card (excluding initial creation)')
ax.set_xlabel('Card ID')
ax.set_ylabel('Number of status changes')
ax.set_xlim(0, 201)
ax.grid(axis='y', alpha=0.25)
fig.tight_layout()
fig.savefig(OUT / 'status_changes_by_card.png', dpi=170)
plt.close(fig)

print(f'Before avg DAU: {before:.2f}; After avg DAU: {after:.2f}; Change: {(after / before - 1) * 100:.1f}%')
print(f'Total status changes: {sum(status_count.values())}; charts saved in: {OUT}')
