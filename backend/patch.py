import os
with open('app/models/maintenance.py', 'r') as f:
    text = f.read()

text = text.replace('Index("ix_mr_status", "status"),', 'Index("ix_mr_status", "status"),\n        Index("ix_mr_section_id", "section_id"),\n        Index("ix_mr_deadline", "deadline"),')

with open('app/models/maintenance.py', 'w') as f:
    f.write(text)
