# Copilot Instructions

## Project Guidelines
- The user encountered a tricky bug where JWT token authentication failed (Bearer token rejected) across microservices due to referencing a legacy `Microsoft.AspNetCore.Http` (v2.x) NuGet package in a `.NET 10` Shared Class Library. Replacing it with `<FrameworkReference Include="Microsoft.AspNetCore.App" />` fixed the `HttpContext`/`ClaimsPrincipal` mismatch.