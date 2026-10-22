import re

content = open('js/school-data.js', encoding='utf-8').read()
ids = re.findall(r'id:\s*(\d+)', content)
print('ids:', len(ids))
cls_matches = re.findall(r'classification\s*:\s*\[', content)
print('with_class:', len(cls_matches))
