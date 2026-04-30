using System;
using System.Collections.Generic;
using System.Text;

namespace CapShop.Shared.Exceptions
{
    //Each exception calls could map specifiv Http status code
    //we could livves the GloblaExceptionMiddleware not here
    //domain code just throw the right exceptions; middle ware could handle it



    //404 Not found
    public class NotFoundException : Exception
    {
        public NotFoundException(string resourceName, object key) : base($"{resourceName} with identifier '{key}' was not found")
        {

        }
        public NotFoundException(string message) : base(message)
        {

        }

    }
    //409 Conflict
    public class ConflictException : Exception
    {
        public ConflictException(string message) : base(message) { }
    }
    //422 Unprocessable Entity — business rule / input validation failure.

    public class AppValidationExceptions : Exception
    {
        public List<string> Errors { get; }
        public AppValidationExceptions(string message) : base(message) => Errors = [message];
        public AppValidationExceptions(List<string> errors) : base("One or more Validation Error occured") => Errors = errors;
    }
    //400 BadRequest
    public class DomainException : Exception
    {
        public DomainException(string message) : base(message) { }
    }
    public class UnauthorizedException : Exception
    {
        public UnauthorizedException(string message = "Authentication Required.") : base(message) { }

    }

    //403 Forbidden( authenticated but not authorized for this resource access)
    public class ForbiddenException : Exception {
        public ForbiddenException(string message = "You do not have permission to perform this action.") : base(message) { }
    }
    public class ServiceUnavailableException : Exception
    {
        public ServiceUnavailableException(string message = "A required service is currently unavailable.") : base(message) { }
    }
}