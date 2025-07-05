import music21 as m21
import json
import pyperclip

def sharp_to_S(name):
    return name.replace('#', 'S')

# Parse MIDI
score = m21.converter.parse(r'hardware\fur_elise.mid')
notes = score.parts[0].recurse().notes

melody = []
for n in notes:
    name = sharp_to_S(n.pitches[0].nameWithOctave)
    # Convert durations: quarterLength units to seconds
    dur = float(n.quarterLength * 0.5)
    melody.append((name.replace("-",""), dur))

with open("melody.json", "w+") as f:
    json.dump(melody, f, indent=2)

print(melody)
pyperclip.copy(json.dumps(melody))
