with open('app/database.py', 'r') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'await conn.execute(text(' in line:
        lines[i] = '                ' + line.lstrip()

with open('app/database.py', 'w') as f:
    f.writelines(lines)
