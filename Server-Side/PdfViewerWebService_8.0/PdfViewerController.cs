using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using Syncfusion.Pdf;
using Syncfusion.Pdf.Parsing;
using Syncfusion.SmartDataExtractor;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Text.Json;


namespace PdfViewerWebService_8
{
    [Route("[controller]")]
    [ApiController]
    public class PdfViewerController : ControllerBase
    {
        private IWebHostEnvironment _hostingEnvironment;
        //Initialize the memory cache object   
        public IMemoryCache _cache;
        public PdfViewerController(IWebHostEnvironment hostingEnvironment, IMemoryCache cache)
        {
            _hostingEnvironment = hostingEnvironment;
            _cache = cache;
            Console.WriteLine("PdfViewerController initialized");
        }

        [HttpPost("SaveSignAsImage")]
        [EnableCors("MyPolicy")]
        [Route("[controller]/SaveSignAsImage")]
        public IActionResult SaveSignAsImage([FromBody] Dictionary<string, string> jsonObject)
        {
            try
            {
                string? sign = jsonObject.ContainsKey("data") ? jsonObject["data"] : null;
                string? role = jsonObject.ContainsKey("role") ? jsonObject["role"] : "nurse";

                if (string.IsNullOrWhiteSpace(sign))
                    return BadRequest("No image data received.");

                string signDirectory = Path.Combine(
                    Directory.GetCurrentDirectory(),
                    "wwwroot",
                    "signatures"
                );

                if (!Directory.Exists(signDirectory))
                    Directory.CreateDirectory(signDirectory);

                // Save signature with role-based naming only: sign_{role}.txt
                // This replaces any existing signature for this role
                string fileName = $"sign_{role}.txt";
                string txtPath = Path.Combine(signDirectory, fileName);
                System.IO.File.WriteAllText(txtPath, sign);

                // Also save metadata for tracking
                string metadataFileName = $"sign_{role}_metadata.json";
                string metadataPath = Path.Combine(signDirectory, metadataFileName);
                var metadata = new
                {
                    role = role,
                    savedAt = DateTime.UtcNow
                };
                System.IO.File.WriteAllText(metadataPath, JsonSerializer.Serialize(metadata, new JsonSerializerOptions { WriteIndented = true }));

                return Ok(new { message = $"Signature for {role} updated successfully", role = role });
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Error: " + ex.Message);
            }
        }
        [HttpPost("GetSavedSignature")]
        [EnableCors("MyPolicy")]
        [Route("[controller]/GetSavedSignature")]
        public IActionResult GetSavedSignature([FromBody] Dictionary<string, string> jsonObject)
        {
            try
            {
                string? role = jsonObject.ContainsKey("role") ? jsonObject["role"] : "nurse";

                string signDirectory = Path.Combine(
                    Directory.GetCurrentDirectory(),
                    "wwwroot",
                    "signatures"
                );

                // Get role-specific signature (sign_{role}.txt)
                string fileName = $"sign_{role}.txt";
                string filePath = Path.Combine(signDirectory, fileName);

                // Fallback to legacy sign.txt if role-specific doesn't exist
                if (!System.IO.File.Exists(filePath))
                {
                    string legacyFilePath = Path.Combine(signDirectory, "sign.txt");
                    if (System.IO.File.Exists(legacyFilePath))
                    {
                        filePath = legacyFilePath;
                    }
                    else
                    {
                        return NotFound($"Signature not found for role: {role}");
                    }
                }

                // Read base64 (or full data URL) as text
                string signText = System.IO.File.ReadAllText(filePath);

                return Ok(new
                {
                    data = signText,
                    role = role,
                    message = $"Signature loaded for {role}"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Error: " + ex.Message);
            }
        }
        // GET api/values
        [HttpGet]
        public IEnumerable<string> Get()
        {
            return new string[] { "value1", "value2" };
        }

        // GET api/values/5
        [HttpGet("{id}")]
        public string Get(int id)
        {
            return "value";
        }

        /// <summary>
        /// Extracts all barcode objects found in the PDF document sent from the client.
        /// Uses Syncfusion SmartDataExtractor to extract page objects as JSON, then
        /// filters the result to keep only objects whose Type is "Barcode".
        /// </summary>
        /// <param name="jsonObject">A JSON body containing a base64-encoded PDF string in the "data" field.</param>
        /// <returns>A JSON object containing only the detected barcodes.</returns>
        [HttpPost("ExtractBarcodes")]
        [EnableCors("MyPolicy")]
        [Route("[controller]/ExtractBarcodes")]
        public IActionResult ExtractBarcodes([FromBody] Dictionary<string, string> jsonObject)
        {
            try
            {
                string? base64Data = jsonObject.ContainsKey("data") ? jsonObject["data"] : null;

                if (string.IsNullOrWhiteSpace(base64Data))
                    return BadRequest("No PDF data received.");

                byte[] pdfBytes = Convert.FromBase64String(base64Data);

                DataExtractor extractor = new DataExtractor();
                extractor.ConfidenceThreshold = 0.5f;

                string extractedJson;
                using (MemoryStream pdfStream = new MemoryStream(pdfBytes))
                {
                    extractedJson = extractor.ExtractDataAsJson(pdfStream);
                }

                // Parse the extracted JSON and filter PageObjects where Type == "Barcode"
                var barcodes = new List<object>();

                using (JsonDocument doc = JsonDocument.Parse(extractedJson))
                {
                    if (doc.RootElement.TryGetProperty("Pages", out JsonElement pages))
                    {
                        foreach (JsonElement page in pages.EnumerateArray())
                        {
                            int pageNumber = page.TryGetProperty("PageNumber", out JsonElement pageNumEl)
                                && pageNumEl.TryGetInt32(out int pn) ? pn : 0;

                            if (!page.TryGetProperty("PageObjects", out JsonElement pageObjects))
                                continue;

                            foreach (JsonElement pageObject in pageObjects.EnumerateArray())
                            {
                                if (pageObject.TryGetProperty("Type", out JsonElement typeEl)
                                    && typeEl.ValueEquals("Barcode"))
                                {
                                    // Build a refined barcode object using raw values from the source JSON.
                                    string content = pageObject.TryGetProperty("Content", out JsonElement contentEl)
                                        ? contentEl.GetString() ?? string.Empty
                                        : string.Empty;

                                    string barcodeType = pageObject.TryGetProperty("BarcodeType", out JsonElement bcTypeEl)
                                        ? bcTypeEl.GetString() ?? string.Empty
                                        : string.Empty;

                                    double confidence = pageObject.TryGetProperty("Confidence", out JsonElement confEl)
                                        && confEl.TryGetDouble(out double conf) ? conf : 0;

                                    List<double> bounds = new List<double>();
                                    if (pageObject.TryGetProperty("Bounds", out JsonElement boundsEl))
                                    {
                                        foreach (JsonElement b in boundsEl.EnumerateArray())
                                        {
                                            bounds.Add(b.TryGetDouble(out double bv) ? bv : 0);
                                        }
                                    }

                                    barcodes.Add(new
                                    {
                                        pageNumber,
                                        type = "Barcode",
                                        barcodeType,
                                        content,
                                        confidence,
                                        bounds
                                    });
                                }
                            }
                        }
                    }
                }

                var result = new
                {
                    success = true,
                    count = barcodes.Count,
                    barcodes
                };

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Error: " + ex.Message);
            }
        }
    }
}
