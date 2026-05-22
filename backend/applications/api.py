from typing import List
from ninja import NinjaAPI
from django.shortcuts import get_object_or_404

from .models import Application
from .schemas import (
    ApplicationCreateSchema,
    ApplicationUpdateSchema,
    ApplicationOutSchema,
    DecisionSchema,
    ErrorSchema,
)
from .services import ApplicationService, WorkflowError

api = NinjaAPI(title="Application Workflow Tracker API", version="1.0.0")


def _is_reviewer(request) -> bool:
    """
    Role is determined via the X-Role header.
    Accepted values: 'reviewer' or 'applicant' (default).
    """
    return request.headers.get("X-Role", "applicant").lower() == "reviewer"


def _require_reviewer(request) -> bool:
    if not _is_reviewer(request):
        return False
    return True

@api.post("/applications", response={201: ApplicationOutSchema, 400: ErrorSchema})
def create_application(request, payload: ApplicationCreateSchema):
    try:
        app = ApplicationService.create_draft(
            applicant_name=payload.applicant_name,
            applicant_email=payload.applicant_email,
            company_name=payload.company_name,
            application_type=payload.application_type,
            description=payload.description,
        )
        return 201, app
    except Exception as e:
        return 400, {"detail": str(e)}


@api.get("/applications", response=List[ApplicationOutSchema])
def list_applications(request):
    return Application.objects.all()


@api.get("/applications/{app_id}", response={200: ApplicationOutSchema, 404: ErrorSchema})
def get_application(request, app_id: int):
    app = get_object_or_404(Application, id=app_id)
    return 200, app


@api.put("/applications/{app_id}", response={200: ApplicationOutSchema, 400: ErrorSchema, 403: ErrorSchema})
def update_application(request, app_id: int, payload: ApplicationUpdateSchema):
    app = get_object_or_404(Application, id=app_id)
    try:
        fields = {k: v for k, v in payload.model_dump(exclude_unset=True).items() if v is not None}
        app = ApplicationService.update_draft(app, **fields)
        return 200, app
    except WorkflowError as e:
        return 400, {"detail": str(e)}


@api.post("/applications/{app_id}/submit", response={200: ApplicationOutSchema, 400: ErrorSchema})
def submit_application(request, app_id: int):
    app = get_object_or_404(Application, id=app_id)
    try:
        app = ApplicationService.submit(app)
        return 200, app
    except WorkflowError as e:
        return 400, {"detail": str(e)}


@api.post("/applications/{app_id}/resubmit", response={200: ApplicationOutSchema, 400: ErrorSchema})
def resubmit_application(request, app_id: int):
    app = get_object_or_404(Application, id=app_id)
    try:
        app = ApplicationService.resubmit(app)
        return 200, app
    except WorkflowError as e:
        return 400, {"detail": str(e)}


# Reviewer Endpoints

@api.post(
    "/applications/{app_id}/start-review",
    response={200: ApplicationOutSchema, 400: ErrorSchema, 403: ErrorSchema},
)
def start_review(request, app_id: int):
    if not _is_reviewer(request):
        return 403, {"detail": "Only reviewers can start a review."}
    app = get_object_or_404(Application, id=app_id)
    try:
        app = ApplicationService.start_review(app)
        return 200, app
    except WorkflowError as e:
        return 400, {"detail": str(e)}


@api.post(
    "/applications/{app_id}/decision",
    response={200: ApplicationOutSchema, 400: ErrorSchema, 403: ErrorSchema},
)
def make_decision(request, app_id: int, payload: DecisionSchema):
    if not _is_reviewer(request):
        return 403, {"detail": "Only reviewers can make decisions."}
    app = get_object_or_404(Application, id=app_id)
    try:
        app = ApplicationService.make_decision(app, payload.decision, payload.comment)
        return 200, app
    except WorkflowError as e:
        return 400, {"detail": str(e)}
