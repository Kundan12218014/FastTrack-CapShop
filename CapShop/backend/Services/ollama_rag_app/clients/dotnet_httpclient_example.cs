using System.Net.Http.Headers;
using System.Text;

var baseUrl = "http://127.0.0.1:8000";
using var client = new HttpClient();

// 1) Health check
var health = await client.GetStringAsync($"{baseUrl}/api/health");
Console.WriteLine("Health:");
Console.WriteLine(health);

// 2) Ask question
var json = """
{
  "question": "What is this document about?",
  "top_k": 4
}
""";

var content = new StringContent(json, Encoding.UTF8, "application/json");
var askResponse = await client.PostAsync($"{baseUrl}/api/ask", content);
var answer = await askResponse.Content.ReadAsStringAsync();

Console.WriteLine("Answer:");
Console.WriteLine(answer);

// 3) Upload file example
// using var form = new MultipartFormDataContent();
// var fileBytes = await File.ReadAllBytesAsync("sample_policy.txt");
// var fileContent = new ByteArrayContent(fileBytes);
// fileContent.Headers.ContentType = MediaTypeHeaderValue.Parse("text/plain");
// form.Add(fileContent, "file", "sample_policy.txt");
// var uploadResponse = await client.PostAsync($"{baseUrl}/api/upload", form);
// Console.WriteLine(await uploadResponse.Content.ReadAsStringAsync());
