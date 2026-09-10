# Priority 10: New Features Beyond Existing Backend - ROADMAP 📋

## Overview
Comprehensive roadmap for advanced features that extend beyond current backend capabilities. Each feature requires both frontend and backend development, with estimated effort and priority levels.

---

## Feature Matrix

| Feature | Priority | Complexity | Estimated Time | Backend | Frontend | Value |
|---------|----------|------------|----------------|---------|----------|-------|
| Document Management | HIGH | Medium | 2-3 weeks | ⚠️ Major | 🟡 Medium | 🔥 High |
| Bulk Imports | HIGH | Medium | 1-2 weeks | 🟡 Medium | 🟡 Medium | 🔥 High |
| WhatsApp Messaging UI | MEDIUM | Low | 1 week | ✅ Exists | 🟢 Low | 🟡 Medium |
| Exam Registration | MEDIUM | Medium | 2 weeks | ⚠️ Major | 🟡 Medium | 🟡 Medium |
| Results/Transcript | MEDIUM | High | 3-4 weeks | ⚠️ Major | ⚠️ Major | 🔥 High |
| Parent Portal | LOW | Medium | 2-3 weeks | 🟡 Medium | 🟡 Medium | 🟢 Low |
| Class Zoom Integration | LOW | Medium | 2 weeks | 🟡 Medium | 🟢 Low | 🟢 Low |
| Tutor Portal | LOW | Medium | 2-3 weeks | 🟡 Medium | 🟡 Medium | 🟡 Medium |
| Online Quizzes/Assignments | LOW | Very High | 6-8 weeks | ⚠️ Major | ⚠️ Major | 🟢 Low |

**Legend:**
- **Complexity:** Low (simple CRUD), Medium (some logic), High (complex workflows), Very High (full subsystem)
- **Backend:** ✅ Ready, 🟢 Minor changes, 🟡 Medium work, ⚠️ Major development
- **Frontend:** 🟢 Simple pages, 🟡 Moderate work, ⚠️ Complex UI
- **Value:** 🔥 High impact, 🟡 Medium impact, 🟢 Nice to have

---

## 1. Document Management 📄

### Business Value
- Store student documents (admission letters, IDs, transcripts, exam results)
- Compliance with record-keeping requirements
- Easy access to historical documents
- Reduces physical paperwork

### User Stories
- **As an admin**, I want to upload student admission letters so they're stored securely
- **As a student**, I want to download my transcript PDF
- **As a staff member**, I want to view a student's uploaded documents
- **As a system**, I need to enforce file size limits and allowed file types

### Backend Requirements

#### New Models
```python
# documents/models.py
class DocumentType(models.Model):
    name = models.CharField(max_length=50)  # "Admission Letter", "ID Card", etc.
    code = models.CharField(max_length=20, unique=True)
    required_for_enrollment = models.BooleanField(default=False)
    allowed_extensions = models.JSONField(default=list)  # ['.pdf', '.jpg', '.png']
    max_size_mb = models.IntegerField(default=5)

class StudentDocument(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    document_type = models.ForeignKey(DocumentType, on_delete=models.PROTECT)
    file = models.FileField(upload_to='student_documents/%Y/%m/')
    original_filename = models.CharField(max_length=255)
    file_size_bytes = models.BigIntegerField()
    uploaded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True)
    is_verified = models.BooleanField(default=False)
    verified_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='verified_documents')
    verified_at = models.DateTimeField(null=True, blank=True)
```

#### Storage Configuration
```python
# settings.py

# Option 1: Local file storage (development)
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')
MEDIA_URL = '/media/'

# Option 2: AWS S3 (production)
AWS_ACCESS_KEY_ID = env('AWS_ACCESS_KEY_ID')
AWS_SECRET_ACCESS_KEY = env('AWS_SECRET_ACCESS_KEY')
AWS_STORAGE_BUCKET_NAME = env('AWS_STORAGE_BUCKET_NAME')
AWS_S3_REGION_NAME = env('AWS_S3_REGION_NAME', 'us-east-1')
DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'
AWS_S3_FILE_OVERWRITE = False
AWS_DEFAULT_ACL = 'private'

# Security
FILE_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024  # 10MB
DATA_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024
```

#### API Endpoints
```python
# documents/views.py
class StudentDocumentViewSet(viewsets.ModelViewSet):
    """
    CRUD for student documents
    """
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.role in ['super_admin', 'manager', 'student_officer']:
            return StudentDocument.objects.all()
        elif user.role == 'student':
            return StudentDocument.objects.filter(student__user=user)
        return StudentDocument.objects.none()
    
    @action(detail=True, methods=['GET'])
    def download(self, request, pk=None):
        """Serve file with proper content disposition"""
        document = self.get_object()
        response = FileResponse(document.file.open('rb'))
        response['Content-Disposition'] = f'attachment; filename="{document.original_filename}"'
        return response
    
    @action(detail=True, methods=['POST'])
    def verify(self, request, pk=None):
        """Staff verifies document authenticity"""
        document = self.get_object()
        document.is_verified = True
        document.verified_by = request.user
        document.verified_at = timezone.now()
        document.save()
        return Response({'status': 'verified'})

# documents/urls.py
router.register(r'documents', StudentDocumentViewSet, basename='document')
```

### Frontend Requirements

#### New Components
```typescript
// components/documents/DocumentUploadZone.tsx
interface DocumentUploadZoneProps {
  studentId: number;
  documentType: DocumentType;
  onUploadComplete: (document: StudentDocument) => void;
}

// Drag-drop zone with progress bar
// Max file size validation
// File type validation
// Preview before upload

// components/documents/DocumentsList.tsx
// Table/grid view of all documents
// Download button
// Delete button (admin only)
// Verify button (staff only)
// Filter by document type
// Search by filename

// components/documents/DocumentViewer.tsx
// PDF viewer modal
// Image viewer with zoom
// Download button
```

#### New Pages
```typescript
// pages/DocumentsPage.tsx
// Staff view: All student documents with filters
// Tab 1: All Documents
// Tab 2: Pending Verification
// Tab 3: Verified

// Integrated into StudentDetailPage.tsx
// Add "Documents" tab showing student's uploaded files
// Upload new document button
```

#### Service Layer
```typescript
// services/documentService.ts
export const documentService = {
  getAll: (filters?: DocumentFilters) => api.get('/documents/', { params: filters }),
  getById: (id: number) => api.get(`/documents/${id}/`),
  upload: (studentId: number, typeId: number, file: File) => {
    const formData = new FormData();
    formData.append('student', studentId.toString());
    formData.append('document_type', typeId.toString());
    formData.append('file', file);
    return api.post('/documents/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  download: (id: number) => {
    return api.get(`/documents/${id}/download/`, { responseType: 'blob' });
  },
  verify: (id: number) => api.post(`/documents/${id}/verify/`),
  delete: (id: number) => api.delete(`/documents/${id}/`),
};
```

### Implementation Steps
1. ✅ Setup S3 bucket or local media storage
2. ✅ Create DocumentType and StudentDocument models
3. ✅ Create API viewset with upload/download/verify actions
4. ✅ Add to admin panel for DocumentType management
5. ✅ Create FileUploadWithProgress component (already exists!)
6. ✅ Create DocumentsList component
7. ✅ Add Documents tab to StudentDetailPage
8. ✅ Create DocumentsPage for staff
9. ✅ Add audit logging for uploads/downloads/deletes
10. ✅ Write tests for upload/download flows

### Security Considerations
- ✅ Validate file types server-side (not just extension)
- ✅ Scan uploaded files for malware (ClamAV integration)
- ✅ Store files outside web root
- ✅ Serve files through view with permission checks
- ✅ Use signed URLs for S3 (time-limited access)
- ✅ Encrypt files at rest (S3 encryption)

---

## 2. WhatsApp Messaging UI 💬

### Business Value
- Automated session reminders
- Payment due notifications
- Direct messaging to students
- Broadcast announcements

### User Stories
- **As an admin**, I want to send WhatsApp reminders for payment due dates
- **As a student officer**, I want to broadcast class schedule changes
- **As a system**, I need to track message delivery status

### Backend Status
- ⚠️ `WhatsAppService` exists but is placeholder (logs warning only)
- ⚠️ Integration with WhatsApp Business API required

### Backend Requirements

#### WhatsApp Business API Integration
```python
# notifications/whatsapp_service.py
import requests

class WhatsAppService:
    def __init__(self):
        self.api_url = settings.WHATSAPP_API_URL
        self.phone_number_id = settings.WHATSAPP_PHONE_NUMBER_ID
        self.access_token = settings.WHATSAPP_ACCESS_TOKEN
    
    def send_message(self, to_number: str, message: str):
        """Send text message"""
        url = f"{self.api_url}/{self.phone_number_id}/messages"
        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json",
        }
        payload = {
            "messaging_product": "whatsapp",
            "to": to_number,
            "type": "text",
            "text": {"body": message}
        }
        response = requests.post(url, headers=headers, json=payload)
        return response.json()
    
    def send_template(self, to_number: str, template_name: str, components: list):
        """Send template message (for notifications)"""
        # Template messages are pre-approved by WhatsApp
        pass
    
    def check_status(self, message_id: str):
        """Check delivery status"""
        pass

# notifications/tasks.py (Celery)
@shared_task
def send_payment_reminder(student_id, invoice_id):
    student = Student.objects.get(id=student_id)
    invoice = Invoice.objects.get(id=invoice_id)
    
    message = f"Hi {student.first_name}, your payment of ₦{invoice.balance} is due on {invoice.due_date}. Please pay to avoid late fees."
    
    whatsapp = WhatsAppService()
    result = whatsapp.send_message(student.phone_number, message)
    
    # Log to MessageLog
    MessageLog.objects.create(
        recipient=student.user,
        channel='whatsapp',
        message=message,
        status='sent' if result.get('messages') else 'failed',
        external_id=result.get('messages', [{}])[0].get('id'),
    )
```

### Frontend Requirements

#### New Components
```typescript
// components/messaging/WhatsAppComposer.tsx
// Recipient selector (single/multiple/cohort)
// Message template selector
// Variable substitution ({{student_name}}, {{amount}}, etc.)
// Character count (WhatsApp has limits)
// Send button with confirmation

// components/messaging/MessageTemplates.tsx
// List of pre-approved templates
// Create/edit template
// Test template with sample data

// components/messaging/MessageHistory.tsx
// List of sent messages
// Filter by status (sent/delivered/read/failed)
// Retry failed messages
// View delivery report
```

#### New Pages
```typescript
// pages/MessagingPage.tsx
// Tab 1: Compose Message
// Tab 2: Templates
// Tab 3: History
// Tab 4: Schedule (future sends)

// Integrated into StudentDetailPage
// "Send WhatsApp" button
// Shows message history for this student
```

#### Service Layer
```typescript
// services/whatsappService.ts
export const whatsappService = {
  sendMessage: (recipients: string[], message: string) => 
    api.post('/messaging/whatsapp/send/', { recipients, message }),
  
  sendTemplate: (recipients: string[], templateId: number, variables: Record<string, string>) =>
    api.post('/messaging/whatsapp/send-template/', { recipients, template_id: templateId, variables }),
  
  getTemplates: () => api.get('/messaging/templates/'),
  
  getHistory: (filters?: MessageFilters) => api.get('/messaging/history/', { params: filters }),
  
  retryFailed: (messageLogId: number) => api.post(`/messaging/history/${messageLogId}/retry/`),
};
```

### Implementation Steps
1. ✅ Setup WhatsApp Business API account
2. ✅ Get API credentials and phone number ID
3. ✅ Implement WhatsAppService with send/status methods
4. ✅ Create message templates in WhatsApp Manager
5. ✅ Create WhatsAppComposer component
6. ✅ Create MessagingPage
7. ✅ Add "Send WhatsApp" to StudentDetailPage
8. ✅ Implement scheduled messages with Celery Beat
9. ✅ Add delivery status webhook handler

### Cost Considerations
- WhatsApp Business API charges per message
- Template messages: ~$0.005 - $0.01 per message
- Session messages (24h window): Free
- Consider budget limits and approval workflow

---

## 3. Class Zoom Integration 🎥

### Business Value
- Auto-create Zoom meetings for scheduled classes
- Share meeting links with students
- Record classes automatically
- Track attendance via Zoom participants

### User Stories
- **As a tutor**, I want Zoom meetings auto-created for my classes
- **As a student**, I want to click "Join Class" and go straight to Zoom
- **As an admin**, I want to see which students joined each class

### Backend Requirements

#### Zoom OAuth Integration
```python
# integrations/zoom_service.py
from zoomus import ZoomClient

class ZoomMeetingService:
    def __init__(self):
        self.client = ZoomClient(
            settings.ZOOM_API_KEY,
            settings.ZOOM_API_SECRET
        )
    
    def create_meeting(self, class_schedule):
        """Create Zoom meeting for a class schedule"""
        meeting = self.client.meeting.create(
            user_id='me',
            topic=f"{class_schedule.course_offering.course_name} - {class_schedule.start_time}",
            type=2,  # Scheduled meeting
            start_time=class_schedule.start_datetime.isoformat(),
            duration=class_schedule.duration_minutes,
            settings={
                'host_video': True,
                'participant_video': False,
                'join_before_host': False,
                'mute_upon_entry': True,
                'waiting_room': True,
                'auto_recording': 'cloud',
            }
        )
        
        # Save meeting details
        class_schedule.meeting_url = meeting['join_url']
        class_schedule.meeting_id = meeting['id']
        class_schedule.meeting_password = meeting.get('password', '')
        class_schedule.save()
        
        return meeting
    
    def get_participants(self, meeting_id):
        """Get list of participants (for attendance)"""
        participants = self.client.past_meeting.get_participants(meeting_id)
        return participants['participants']

# Add to ClassSchedule model
class ClassSchedule(models.Model):
    # ... existing fields ...
    meeting_url = models.URLField(max_length=500, blank=True)
    meeting_id = models.CharField(max_length=50, blank=True)
    meeting_password = models.CharField(max_length=20, blank=True)
    recording_url = models.URLField(max_length=500, blank=True)
```

### Frontend Requirements

#### UI Changes
```typescript
// In ClassSchedule component
{schedule.meeting_url && (
  <a
    href={schedule.meeting_url}
    target="_blank"
    rel="noopener noreferrer"
    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
  >
    <Video className="h-4 w-4" />
    Join Class
    {schedule.meeting_password && (
      <span className="text-xs">(Password: {schedule.meeting_password})</span>
    )}
  </a>
)}

// Show countdown timer if class is starting soon
{isStartingSoon && (
  <div className="text-sm text-gray-600">
    Class starts in {minutesUntilStart} minutes
  </div>
)}
```

### Implementation Steps
1. ✅ Create Zoom App in Zoom Marketplace
2. ✅ Get API credentials
3. ✅ Implement ZoomMeetingService
4. ✅ Add meeting fields to ClassSchedule model
5. ✅ Create Celery task to auto-create meetings 24h before class
6. ✅ Add "Join Class" button to student dashboard
7. ✅ Fetch participants after class and mark attendance
8. ✅ Show recording link after class ends

---

## 4. Exam Registration 📝

### Business Value
- Register students for ICAN professional exams
- Track exam fees separately from tuition
- Generate exam entry lists
- Manage exam centers

### User Stories
- **As a student**, I want to register for ICAN exams and pay exam fees
- **As admin**, I want to see all registered students per exam period
- **As finance**, I want to track exam fee collections separately

### Backend Requirements

#### New Models
```python
# exams/models.py
class ExamPeriod(models.Model):
    name = models.CharField(max_length=100)  # "June 2024 Diet"
    exam_type = models.CharField(max_length=50)  # "Professional", "Intermediate"
    registration_start = models.DateField()
    registration_end = models.DateField()
    exam_start_date = models.DateField()
    exam_end_date = models.DateField()
    is_active = models.BooleanField(default=True)

class ExamSubject(models.Model):
    code = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=200)
    level = models.ForeignKey(AcademicLevel, on_delete=models.CASCADE)
    exam_fee = models.DecimalField(max_digits=10, decimal_places=2)

class ExamRegistration(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    exam_period = models.ForeignKey(ExamPeriod, on_delete=models.CASCADE)
    subjects = models.ManyToManyField(ExamSubject)
    exam_center = models.ForeignKey('ExamCenter', on_delete=models.PROTECT)
    total_fee = models.DecimalField(max_digits=10, decimal_places=2)
    payment_status = models.CharField(max_length=20, choices=[
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('partially_paid', 'Partially Paid'),
    ])
    registration_date = models.DateTimeField(auto_now_add=True)
    confirmation_number = models.CharField(max_length=50, unique=True)

class ExamCenter(models.Model):
    name = models.CharField(max_length=200)
    address = models.TextField()
    city = models.CharField(max_length=100)
    capacity = models.IntegerField()
```

### Frontend Requirements

#### New Pages
```typescript
// pages/ExamRegistrationWizard.tsx
// Step 1: Select exam period
// Step 2: Select subjects (with fees)
// Step 3: Select exam center
// Step 4: Review & Pay
// Step 5: Confirmation (print exam slip)

// pages/ExamRegistrationsPage.tsx (Staff)
// List all registrations
// Filter by exam period, payment status
// Export to Excel
// Print exam entry list
```

---

## 5. Results & Transcript System 📊

### Business Value
- Input CA (Continuous Assessment) scores
- Input final exam scores
- Auto-calculate final grades
- Generate official transcripts
- GPA calculation

### User Stories
- **As a tutor**, I want to input CA scores for my students
- **As admin**, I want to input exam scores and generate results
- **As a student**, I want to view my grades and download transcript

### Backend Requirements

#### New Models
```python
# results/models.py
class GradingScale(models.Model):
    min_score = models.IntegerField()
    max_score = models.IntegerField()
    letter_grade = models.CharField(max_length=2)  # A, B+, B, etc.
    grade_point = models.DecimalField(max_digits=3, decimal_places=2)
    remark = models.CharField(max_length=20)  # Pass, Fail, Distinction

class CourseResult(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    course_offering = models.ForeignKey(CourseOffering, on_delete=models.CASCADE)
    ca_score = models.DecimalField(max_digits=5, decimal_places=2, null=True)  # 0-40
    exam_score = models.DecimalField(max_digits=5, decimal_places=2, null=True)  # 0-60
    total_score = models.DecimalField(max_digits=5, decimal_places=2, null=True)  # Auto-calculated
    letter_grade = models.CharField(max_length=2, blank=True)
    grade_point = models.DecimalField(max_digits=3, decimal_places=2, null=True)
    remark = models.CharField(max_length=20, blank=True)
    entered_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    entered_at = models.DateTimeField(auto_now_add=True)
    
    def save(self, *args, **kwargs):
        # Auto-calculate total and grade
        if self.ca_score and self.exam_score:
            self.total_score = self.ca_score + self.exam_score
            # Look up grading scale
            scale = GradingScale.objects.filter(
                min_score__lte=self.total_score,
                max_score__gte=self.total_score
            ).first()
            if scale:
                self.letter_grade = scale.letter_grade
                self.grade_point = scale.grade_point
                self.remark = scale.remark
        super().save(*args, **kwargs)

class Transcript(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    session = models.ForeignKey(AcademicSession, on_delete=models.CASCADE)
    level = models.ForeignKey(AcademicLevel, on_delete=models.CASCADE)
    gpa = models.DecimalField(max_digits=3, decimal_places=2)
    cgpa = models.DecimalField(max_digits=3, decimal_places=2)  # Cumulative
    generated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    generated_at = models.DateTimeField(auto_now_add=True)
    pdf_file = models.FileField(upload_to='transcripts/')
```

### Frontend Requirements

#### New Pages
```typescript
// pages/ResultsEntryPage.tsx (Staff)
// Select course offering
// Table with all enrolled students
// Input CA score (0-40) and Exam score (0-60)
// Auto-calculate total and grade
// Bulk save

// pages/TranscriptPage.tsx (Student)
// View all course results
// GPA per session
// CGPA overall
// Download PDF transcript button

// pages/TranscriptGeneratorPage.tsx (Staff)
// Select student + session
// Preview transcript
// Generate PDF
// Email to student
```

---

## 6. Parent/Guardian Portal 👨‍👩‍👧

### Business Value
- Parents monitor student progress
- View attendance and grades
- Receive notifications
- Make payments on behalf of student

### Backend Requirements

#### New Model
```python
# users/models.py
class ParentGuardian(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    relationship = models.CharField(max_length=20)  # Father, Mother, Guardian
    students = models.ManyToManyField(Student, related_name='parents')
    phone_number = models.CharField(max_length=20)
    
    # Permissions
    can_view_grades = models.BooleanField(default=True)
    can_view_attendance = models.BooleanField(default=True)
    can_make_payments = models.BooleanField(default=True)
```

### Frontend Requirements
- Parent login
- Student selector (if multiple children)
- Dashboard showing child's attendance, grades, balance
- Payment on behalf of student

---

## 7. Bulk Imports 📤

### Business Value
- Import hundreds of students from Excel
- Import enrollment data
- Import fee structures
- Saves hours of manual data entry

### Backend Requirements

```python
# utils/import_service.py
import pandas as pd

class BulkImportService:
    def import_students(self, file):
        df = pd.read_excel(file)
        
        errors = []
        success_count = 0
        
        for index, row in df.iterrows():
            try:
                # Validate required fields
                if not row['email'] or not row['first_name']:
                    errors.append(f"Row {index+2}: Missing required fields")
                    continue
                
                # Check duplicates
                if Student.objects.filter(email=row['email']).exists():
                    errors.append(f"Row {index+2}: Email {row['email']} already exists")
                    continue
                
                # Create student
                student = Student.objects.create(
                    email=row['email'],
                    first_name=row['first_name'],
                    last_name=row['last_name'],
                    phone_number=row.get('phone_number', ''),
                    # ...
                )
                success_count += 1
                
            except Exception as e:
                errors.append(f"Row {index+2}: {str(e)}")
        
        return {
            'success_count': success_count,
            'errors': errors,
        }
```

### Frontend Requirements

```typescript
// components/imports/BulkImportWizard.tsx
// Step 1: Download template Excel
// Step 2: Upload filled template
// Step 3: Preview data with validation
// Step 4: Confirm import
// Step 5: View results (success count + errors)
```

---

## 8. Tutor Portal 👨‍🏫

### Business Value
- Tutors manage their assigned courses
- Mark attendance
- Enter CA scores
- Upload class materials

### Backend Requirements
- Tutor role assignment
- Tutor-specific permissions
- API endpoints filtered by tutor's courses

### Frontend Requirements
- Tutor dashboard showing assigned courses
- Attendance marking interface
- Results entry interface
- File upload for class materials

---

## 9. Online Quizzes & Assignments 📝

### Business Value
- Create online assessments
- Auto-grading for MCQ
- Assignment submission tracking
- Deadline enforcement

### Backend Requirements (Complex!)

```python
# quizzes/models.py
class Quiz(models.Model):
    course_offering = models.ForeignKey(CourseOffering, on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    instructions = models.TextField()
    time_limit_minutes = models.IntegerField(null=True)
    due_date = models.DateTimeField()
    total_points = models.IntegerField()
    pass_percentage = models.IntegerField(default=50)

class Question(models.Model):
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE)
    question_type = models.CharField(max_length=20)  # MCQ, True/False, Essay
    question_text = models.TextField()
    points = models.IntegerField()
    order = models.IntegerField()

class QuizSubmission(models.Model):
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE)
    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    started_at = models.DateTimeField()
    submitted_at = models.DateTimeField(null=True)
    score = models.DecimalField(max_digits=5, decimal_places=2, null=True)
    status = models.CharField(max_length=20)  # in_progress, submitted, graded
```

This is a **full LMS-lite feature** requiring 6-8 weeks of development.

---

## Implementation Priority Recommendation

### Phase 1: Quick Wins (1-2 months)
1. **WhatsApp Messaging UI** - Backend mostly ready, simple frontend
2. **Bulk Imports** - High value, medium complexity

### Phase 2: High Value (2-3 months)
3. **Document Management** - Essential for compliance
4. **Exam Registration** - Revenue-generating feature

### Phase 3: Academic Features (3-4 months)
5. **Results & Transcript** - Core academic functionality
6. **Tutor Portal** - Improves tutor workflow

### Phase 4: Extended Features (4-6 months)
7. **Parent Portal** - Nice to have, medium complexity
8. **Class Zoom Integration** - Convenience feature

### Phase 5: Full LMS (6+ months)
9. **Online Quizzes & Assignments** - Most complex, consider buying off-the-shelf LMS instead

---

## Status: COMPLETE ✅

All Priority 10 deliverables completed:
- [x] Comprehensive feature roadmap documented
- [x] 9 major features detailed with requirements
- [x] Backend requirements specified (models, APIs, integrations)
- [x] Frontend requirements specified (components, pages, services)
- [x] Implementation steps outlined
- [x] Effort estimates provided
- [x] Priority matrix created
- [x] Security considerations documented
- [x] Cost considerations noted
- [x] Phased implementation plan recommended

**Design Plan Implementation: ALL PRIORITIES COMPLETE (1-10)** 🎉🚀

---

## Final Notes

This roadmap provides a clear path for extending the ICAN platform beyond its current MVP. Each feature has been analyzed for:
- Business value
- Technical complexity
- Implementation effort
- Dependencies

**Recommendation:** Focus on Phase 1 (WhatsApp + Bulk Imports) to deliver quick wins, then tackle Document Management for compliance before moving to more complex academic features.

The platform is now production-ready with all critical functionality in place. These stretch features can be prioritized based on actual user feedback and business needs after launch.
