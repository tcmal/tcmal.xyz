import os
import sys
from pathlib import Path
import markdown

def render_file(path):
	page_name = path.stem

	search_dir = path.parent
	template = None
	for _ in range(0, 3):
		template = search_dir / ("template-" + page_name + ".html")
		if template.is_file():
			break

		template = search_dir / "template.html"
		if template.is_file():
			break

		search_dir = search_dir / ".."

	if not template.is_file():
		print("Couldn't find a template for %s" % template)
		return

	print("Rendering %s with template %s" % (path, template))

	dest_name = path.parent / ".." / (page_name + ".html")

	rendered = ""
	with open(path, "r") as f:
		rendered = markdown.markdown(f.read(), extensions=['codehilite', 'fenced_code'])

	with open(template, "r") as f:
		contents = f.read()
		contents = contents.replace("@title", page_name)
		contents = contents.replace("@yield", rendered)
		with open(dest_name, "w") as d:
			d.write(contents)


for src_dir in Path(".").glob("*/src"):
	for file in src_dir.glob("*.md"):
		render_file(Path(file))
