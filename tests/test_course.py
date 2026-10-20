import json
import unittest
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
class CourseTests(unittest.TestCase):
    def test_lesson_schema_and_quizzes(self):
        lessons=json.loads((ROOT/'course/lessons.json').read_text(encoding='utf-8'))
        self.assertGreaterEqual(len(lessons), 25)
        ids=set()
        for lesson in lessons:
            self.assertTrue(lesson['id'] not in ids)
            ids.add(lesson['id'])
            for field in ['title','hook','body','formula','case','advisor_application','sources','quiz']:
                self.assertTrue(lesson.get(field), f"{lesson['id']} missing {field}")
            for q in lesson['quiz']:
                self.assertTrue(0 <= q['answer'] < len(q['options']))
                self.assertGreaterEqual(len(q['options']), 4)
                self.assertTrue(q['explanation'])
    def test_roadmap(self):
        roadmap=json.loads((ROOT/'course/roadmap.json').read_text(encoding='utf-8'))
        self.assertGreaterEqual(len(roadmap['daily_sequence']), 40)
    def test_exams(self):
        exams=json.loads((ROOT/'course/exams.json').read_text(encoding='utf-8'))
        for k in ['weekly','monthly','quarterly','annual','spaced_repetition']:
            self.assertIn(k,exams)
if __name__=='__main__': unittest.main()
