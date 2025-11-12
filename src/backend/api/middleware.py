from django.shortcuts import redirect


class CheckUserRoleMiddleware:
    """
    Middleware that ensures authenticated users have selected a role.

    Behavior:
    - Runs before the view (so we can short-circuit and redirect early).
    - Excludes API endpoints and the role-selection path itself.
    - If the user is authenticated and has no role, redirects to /api/select-role/.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Only act for authenticated users
        try:
            user = request.user
        except Exception:
            user = None

        if (
            user is not None
            and getattr(user, "is_authenticated", False)
            and not request.path.startswith("/api/")
            and not request.path.startswith("/select-role/")
            and not getattr(user, "has_role", False)
        ):
            # Redirect early before calling the view
            return redirect("/api/select-role/")

        response = self.get_response(request)
        return response
