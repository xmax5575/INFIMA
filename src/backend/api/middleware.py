from django.shortcuts import redirect


class CheckUserRoleMiddleware:
    # Middleware za provjeru odabira rolea

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Samo za ulogirane
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
            # redirect prije poziva viewa
            return redirect("/api/select-role/")

        response = self.get_response(request)
        return response
