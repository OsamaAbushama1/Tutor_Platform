# api/management/commands/seed_teachers.py
from django.core.management.base import BaseCommand
from api.models import Teacher

class Command(BaseCommand):
    help = 'Seeds the database with teacher data'

    def handle(self, *args, **kwargs):
        teachers_data = {
            "teachers": [
                {
                    "id": 1,
                    "name": "Rawda Mohamed",
                    "subject": "Arabic",
                    "governorate": "Cairo",
                    "price_per_session": 250,
                    "max_students_per_group": 8,
                    "schedule": {"9:00 AM": "Giza Square", "12:00 PM": "Pyramids", "3:00 PM": "Sheikh Zayed"},
                    "promotional_videos": "https://www.youtube.com/watch?v=example2",
                    "image": "https://degrees.snu.edu/hubfs/Teaching%20a%20good%20career-1.jpeg"
                },
                {
                    "id": 2,
                    "name": "Ahmed Mohamed",
                    "subject": "Mathematics",
                    "governorate": "Cairo",
                    "price_per_session": 200,
                    "max_students_per_group": 10,
                    "schedule": {"9:00 AM": "Tahrir Street", "12:00 PM": "Ramses Square", "3:00 PM": "Nasr City"},
                    "promotional_videos": "https://www.youtube.com/watch?v=example",
                    "image": "https://gsep.pepperdine.edu/blog/images/how-much-could-a-masters-degree-increase-your-teaching-salary.png"
                },
                {
                    "id": 3,
                    "name": "Mohamed Hassan",
                    "subject": "Mathematics",
                    "governorate": "Cairo",
                    "price_per_session": 200,
                    "max_students_per_group": 10,
                    "schedule": {"9:00 AM": "Tahrir Street", "12:00 PM": "Ramses Square", "3:00 PM": "Nasr City"},
                    "promotional_videos": "https://www.youtube.com/watch?v=example",
                    "image": "https://gsep.pepperdine.edu/blog/images/how-much-could-a-masters-degree-increase-your-teaching-salary.png"
                },
                {
                    "id": 4,
                    "name": "Maryam Ali",
                    "subject": "English",
                    "governorate": "Giza",
                    "price_per_session": 250,
                    "max_students_per_group": 8,
                    "schedule": {"9:00 AM": "Giza Square", "12:00 PM": "Pyramids", "3:00 PM": "Sheikh Zayed"},
                    "promotional_videos": "https://www.youtube.com/watch?v=example2",
                    "image": "https://degrees.snu.edu/hubfs/Teaching%20a%20good%20career-1.jpeg"
                },
                {
                    "id": 5,
                    "name": "Maria Medhat",
                    "subject": "English",
                    "governorate": "Giza",
                    "price_per_session": 250,
                    "max_students_per_group": 8,
                    "schedule": {"9:00 AM": "Giza Square", "12:00 PM": "Pyramids", "3:00 PM": "Sheikh Zayed"},
                    "promotional_videos": "https://www.youtube.com/watch?v=example2",
                    "image": "https://degrees.snu.edu/hubfs/Teaching%20a%20good%20career-1.jpeg"
                }
            ]
        }

        # حذف البيانات القديمة
        Teacher.objects.all().delete()
        self.stdout.write(self.style.WARNING('Deleted all existing teachers.'))

        # إضافة المعلمين
        for teacher_data in teachers_data["teachers"]:
            teacher = Teacher.objects.create(
                id=teacher_data["id"],
                name=teacher_data["name"],
                governorate=teacher_data["governorate"],
                subject=teacher_data["subject"],
                price_per_session=teacher_data["price_per_session"],
                max_students_per_group=teacher_data["max_students_per_group"],
                schedule=teacher_data["schedule"],
                promotional_videos=teacher_data["promotional_videos"],
                image=teacher_data["image"]
            )
            self.stdout.write(self.style.SUCCESS(f'Added teacher: {teacher.name}'))

        # التحقق من عدد السجلات
        teacher_count = Teacher.objects.count()
        self.stdout.write(self.style.SUCCESS(f'Total teachers in database: {teacher_count}'))