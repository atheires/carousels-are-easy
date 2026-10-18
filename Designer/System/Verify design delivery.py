"""Check recorded review evidence and file identity; does not judge visual quality.

Usage: python "Verify design delivery.py" manifest.json
Manifest fields: stage (presentation/body_start/deck_delivery), expected_slides,
cover_user_approved (boolean), slides (records with path, sha256, preview_path,
preview_sha256, verdict, model, effort, required_checks_verified,
unresolved_required_defects). Deck delivery additionally needs
deck_comparison_verified. Paths must be absolute. Review assertions are supplied
by the designer/critic and are not independently authenticated by this tool.
"""
import hashlib
import json
import sys
from pathlib import Path
from PIL import Image

def digest(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()

def validate(m):
    errors = []
    stage = m.get('stage')
    if stage not in ('presentation', 'body_start', 'deck_delivery'):
        errors.append('Unknown delivery stage')
    if stage in ('body_start', 'deck_delivery') and m.get('cover_user_approved') is not True:
        errors.append('User cover approval absent')
    slides = m.get('slides', [])
    if not slides or len(slides) != m.get('expected_slides'):
        errors.append('Reviewed slide count differs from expected count')
    if stage == 'deck_delivery' and m.get('deck_comparison_verified') is not True:
        errors.append('Cross-slide comparison unverified')
    seen = set()
    for n, s in enumerate(slides, 1):
        prefix = f'Slide record {n}: '
        if s.get('verdict') != 'PASS': errors.append(prefix + 'critic verdict is not PASS')
        if (s.get('model'), s.get('effort')) != ('gpt-6.1-sol', 'medium'):
            errors.append(prefix + 'wrong or unrecorded critic configuration')
        if s.get('required_checks_verified') is not True:
            errors.append(prefix + 'required evidence is unverified')
        if s.get('unresolved_required_defects') != 0:
            errors.append(prefix + 'unresolved/unknown P0 or P1 defects')
        for field, hash_field in [('path','sha256'), ('preview_path','preview_sha256')]:
            try:
                p = Path(s[field])
                if not p.is_absolute(): raise ValueError('path must be absolute')
                if field == 'path':
                    identity = str(p.resolve()).casefold()
                    if identity in seen: errors.append(prefix + 'duplicate final image')
                    seen.add(identity)
                if digest(p) != s.get(hash_field): errors.append(prefix + field + ' changed since review')
                with Image.open(p) as im:
                    if field == 'preview_path' and not 320 <= im.width <= 400:
                        errors.append(prefix + 'preview width is outside 320–400 pixels')
                    if field == 'path':
                        ratio = s.get('aspect_ratio')
                        if not isinstance(ratio, list) or len(ratio) != 2:
                            errors.append(prefix + 'requested aspect ratio unrecorded')
                        elif im.width * ratio[1] != im.height * ratio[0]:
                            errors.append(prefix + 'measured aspect ratio differs from brief')
            except (OSError, KeyError, ValueError) as exc:
                errors.append(prefix + field + ' unavailable: ' + str(exc))
    return errors

if __name__ == '__main__':
    errors = validate(json.loads(Path(sys.argv[1]).read_text(encoding='utf-8')))
    print(json.dumps({'result': 'BLOCK' if errors else 'PASS', 'errors': errors}, indent=2))
    sys.exit(bool(errors))
