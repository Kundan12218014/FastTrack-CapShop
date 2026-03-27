using System.Text;
using CapShop.AdminService.Application.DTOs;

namespace CapShop.AdminService.Application.Services;

/// <summary>
/// Generates CSV and PDF export files from report data.
/// CSV is generated in-memory using StringBuilder.
/// PDF is generated as plain HTML for simplicity —
/// in production use a library like iTextSharp or QuestPDF.
/// </summary>
public class ReportExportService
{
    /// <summary>
    /// Generates a CSV byte array from a sales report.
    /// Returns raw bytes — the controller sets Content-Type and Content-Disposition.
    /// </summary>
    public byte[] GenerateSalesCsv(SalesReportDto report)
    {
        var sb = new StringBuilder();

        // Header row
        sb.AppendLine("Date,Revenue,Orders");

        // Data rows
        foreach (var day in report.DailyBreakdown)
        {
            sb.AppendLine(
                $"{day.Date:yyyy-MM-dd}," +
                $"{day.Revenue:F2}," +
                $"{day.Orders}");
        }

        // Summary row
        sb.AppendLine();
        sb.AppendLine($"Total,{report.TotalRevenue:F2},{report.TotalOrders}");
        sb.AppendLine($"Average Order Value,{report.AverageOrderValue:F2},");

        return Encoding.UTF8.GetBytes(sb.ToString());
    }

    /// <summary>
    /// Generates a CSV byte array from a status split report.
    /// </summary>
    public byte[] GenerateStatusSplitCsv(StatusSplitReportDto report)
    {
        var sb = new StringBuilder();
        sb.AppendLine("Status,Count,Percentage");

        foreach (var item in report.StatusBreakdown)
            sb.AppendLine($"{item.Status},{item.Count},{item.Percentage:F1}%");

        sb.AppendLine();
        sb.AppendLine($"Total,{report.TotalOrders},100%");

        return Encoding.UTF8.GetBytes(sb.ToString());
    }

    /// <summary>
    /// Generates a simple HTML page formatted as a printable sales report.
    /// In production replace with QuestPDF or iTextSharp for proper PDF generation.
    /// </summary>
    public byte[] GenerateSalesHtml(SalesReportDto report)
    {
        var sb = new StringBuilder();
        sb.AppendLine("<!DOCTYPE html><html><head><meta charset='utf-8'>");
        sb.AppendLine("<style>body{font-family:Arial,sans-serif;margin:32px}");
        sb.AppendLine("h1{color:#1B3A6B}table{width:100%;border-collapse:collapse}");
        sb.AppendLine("th{background:#1B3A6B;color:white;padding:8px;text-align:left}");
        sb.AppendLine("td{padding:8px;border-bottom:1px solid #ddd}");
        sb.AppendLine(".summary{margin-bottom:24px;padding:16px;background:#f5f5f5;border-radius:8px}");
        sb.AppendLine("</style></head><body>");
        sb.AppendLine($"<h1>CapShop Sales Report</h1>");
        sb.AppendLine($"<p>Period: {report.From:dd MMM yyyy} — {report.To:dd MMM yyyy}</p>");
        sb.AppendLine("<div class='summary'>");
        sb.AppendLine($"<strong>Total Revenue:</strong> ₹{report.TotalRevenue:N2}&nbsp;&nbsp;");
        sb.AppendLine($"<strong>Total Orders:</strong> {report.TotalOrders}&nbsp;&nbsp;");
        sb.AppendLine($"<strong>Avg Order Value:</strong> ₹{report.AverageOrderValue:N2}");
        sb.AppendLine("</div>");
        sb.AppendLine("<table><tr><th>Date</th><th>Revenue (₹)</th><th>Orders</th></tr>");

        foreach (var day in report.DailyBreakdown)
            sb.AppendLine(
                $"<tr><td>{day.Date:dd MMM yyyy}</td>" +
                $"<td>{day.Revenue:N2}</td>" +
                $"<td>{day.Orders}</td></tr>");

        sb.AppendLine("</table></body></html>");

        return Encoding.UTF8.GetBytes(sb.ToString());
    }
}