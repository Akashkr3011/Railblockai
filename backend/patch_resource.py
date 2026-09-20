import os
with open('app/models/resource.py', 'r') as f:
    text = f.read()

old_str = '__table_args__ = ({"comment": "Human gangs, machines, vehicles and specialist crews"},)'
new_str = '__table_args__ = (\n        Index("ix_resources_type", "resource_type"),\n        Index("ix_resources_is_available", "is_available"),\n        {"comment": "Human gangs, machines, vehicles and specialist crews"}\n    )'

text = text.replace(old_str, new_str)

with open('app/models/resource.py', 'w') as f:
    f.write(text)
