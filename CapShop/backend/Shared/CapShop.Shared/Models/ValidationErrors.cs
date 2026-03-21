using System;
using System.Collections.Generic;
using System.Text;
using static System.Net.WebRequestMethods;

namespace CapShop.Shared.Models
{
    //Structred field-level validation errors
    public class ValidationErrors
    {
        public string Field { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        ValidationErrors() { }
        public ValidationErrors(string fields,string message)
        {
            Field = Field;
            Message = message;
        }

    }
    //extending APi resPonse the Field level for the error response
    public class ValidationApiResponse : ApiResponse<Object>
    {
        public List<ValidationErrors> FieldErrors { get; set; } = [];
        public static ValidationApiResponse WithFieldErrors(string message, List<ValidationErrors> fieldErrors)
        {
            return new ValidationApiResponse
            {
                Success = false,
                Message = message,
                FieldErrors = fieldErrors,
                Errors = fieldErrors.Select(e => $"{e.Field}: {e.Message}").ToList()
            };
           

        }
    }
}
