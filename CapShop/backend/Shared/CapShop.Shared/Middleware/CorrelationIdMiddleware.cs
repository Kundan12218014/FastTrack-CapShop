using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Text;
/// Assigns a unique X-Correlation-Id header to every request.
///
/// Why this matters in microservices:
/// When a single user action triggers calls across Auth → Order → Catalog,
/// each service logs its own entries. Without a shared ID it is impossible
/// to trace a user's full request journey across service logs.
namespace CapShop.Shared.Middleware
{
    public class CorrelationIdMiddleware(RequestDelegate next)
    {
        private const string CorrelationIdHeader = "X-Correlation-Id";
        public async Task InvokeAsync(HttpContext context)
        {
            var correlationId = context.Request.Headers[CorrelationIdHeader].FirstOrDefault()
                                                        ?? Guid.NewGuid().ToString();

            //making available to the response so the client can log it too
            context.Response.Headers[CorrelationIdHeader] = correlationId;

            //store the HttpContext.Items so any service or middleware can use it
            context.Items[CorrelationIdHeader] = correlationId;
            await next(context);
        }
    }
}
