using System;
using System.Collections.Generic;
using System.Text;

namespace CapShop.Shared.Models
{
    public class PagedResult<T>
    {
        public IEnumerable<T> Items { get; set; } = [];
        public int TotalCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }

        //Storing preComputed Value
        public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
        public bool HasNextPage => PageSize < TotalPages;
        public bool HasPreviousPage => Page > 1;

        public PagedResult() { }
        public PagedResult(IEnumerable<T>items,int totalCount,int page,int pageSize)
        {
            Items = items;
            TotalCount = totalCount;
            Page = page;
            PageSize = pageSize;
        }

    }
}
