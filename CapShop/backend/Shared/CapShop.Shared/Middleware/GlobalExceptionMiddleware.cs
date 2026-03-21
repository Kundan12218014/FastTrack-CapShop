using CapShop.Shared.Exceptions;
using CapShop.Shared.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Net;
using System.Text;
using System.Text.Json;


namespace CapShop.Shared.Middleware
{
//    NotFoundException	404
//ConflictException	409
//AppValidationException	422
//DomainException	400
//UnauthorizedException	401
//ForbiddenException	403
//ServiceUnavailableException	503
//Any unknown error	500
    public class GlobalExceptionMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<GlobalExceptionMiddleware> _logger;
        private static readonly JsonSerializerOptions _jsonOptions = new()
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            WriteIndented =false
        };
        public GlobalExceptionMiddleware(RequestDelegate next,ILogger<GlobalExceptionMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,"Unhandled exception on {Method} {Path} | TraceId : {TraceId)",
                    context.Request.Method,
                    context.Request.Path,
                    context.TraceIdentifier);

                await HandleExceptionAsync(context, ex);
            }
        }
        public static Task HandleExceptionAsync(HttpContext context,Exception exception)
        {
            //if response is already started we cannot write the status code just abort
            if (context.Response.HasStarted)
            {
                return Task.CompletedTask;
            }
            context.Response.ContentType = "applicatoin/json";
            var (statusCode, response) = exception switch
            {
                NotFoundException ex => (HttpStatusCode.NotFound, ApiResponse<Object>.Fail(ex.Message)),
                ConfilictException ex => (HttpStatusCode.Conflict, ApiResponse<object>.Fail(ex.Message)),
                AppValidationExceptions ex => (HttpStatusCode.UnprocessableEntity, ApiResponse<object>.Fail(ex.Message, ex.Errors)),
                DomainException ex => (HttpStatusCode.BadRequest,
                 ApiResponse<object>.Fail(ex.Message)),

                UnauthorizedException ex =>
                    (HttpStatusCode.Unauthorized,
                     ApiResponse<object>.Fail(ex.Message)),

                ForbiddenException ex =>
                    (HttpStatusCode.Forbidden,
                     ApiResponse<object>.Fail(ex.Message)),

                ServiceUnavailableException ex =>
                    (HttpStatusCode.ServiceUnavailable,
                     ApiResponse<object>.Fail(ex.Message)),
                _ => (HttpStatusCode.InternalServerError, ApiResponse<object>.Fail("An unexcepted error occured. Please try again later."))
            };  

            context.Response.StatusCode = (int)statusCode;
            return context.Response.WriteAsync(JsonSerializer.Serialize(response, _jsonOptions));

        }
    }
}
