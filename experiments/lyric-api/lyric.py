from lyrics_transcriber import LyricsTranscriber
transcriber = LyricsTranscriber(audio_filepath=r'C:\Users\laksh\Desktop\Projects\miss-americana-ui\experiments\lyric-api\aud.mp3')
result_metadata = transcriber.generate()