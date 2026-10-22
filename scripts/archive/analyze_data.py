import re
from collections import Counter

with open('js/school-data.js', 'r', encoding='utf-8') as f:
    content = f.read()

ids = re.findall(r'id:\s*(\d+)', content)
print('Total schools:', len(ids))

names = re.findall(r'name:\s*"([^"]+)"', content)
print('Total names:', len(names))

types = re.findall(r'school_type:\s*"([^"]+)"', content)
print('Types:', dict(Counter(types)))

statuses = re.findall(r'status:\s*"([^"]*)"', content)
print('Statuses:', dict(Counter(statuses)))

# Extract regions
regions = re.findall(r'"([A-Za-z][A-Za-z\s]+)":\s*\{', content)
print('Regions:', len(regions))
for r in regions:
    print('  -', r.strip())

# Count schools per region
region_blocks = re.split(r'"([A-Za-z][A-Za-z\s]+)":\s*\{', content)
for i in range(1, len(region_blocks), 2):
    region_name = region_blocks[i].strip()
    block = region_blocks[i+1] if i+1 < len(region_blocks) else ''
    school_count = block.count('id:')
    print(f'  {region_name}: {school_count} schools')

# Check for duplicate names
name_counts = Counter(names)
dupes = {n: c for n, c in name_counts.items() if c > 1}
print(f'\nDuplicate names: {len(dupes)}')
for n, c in list(dupes.items())[:20]:
    print(f'  {n}: {c} occurrences')
