using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
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

                if (string.IsNullOrWhiteSpace(sign))
                    return BadRequest("No image data received.");

                string signDirectory = Path.Combine(
                    Directory.GetCurrentDirectory(),
                    "wwwroot",
                    "signatures"
                );

                if (!Directory.Exists(signDirectory))
                    Directory.CreateDirectory(signDirectory);

                // Save JSON (optional)
                string txtPath = Path.Combine(signDirectory, "sign.txt");
                System.IO.File.WriteAllText(txtPath, sign);

                return Ok("Signature saved as text and image.");
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Error: " + ex.Message);
            }
        }
        [HttpGet("GetSavedSignature")]
        [EnableCors("MyPolicy")]
        [Route("[controller]/GetSavedSignature")]
        public IActionResult GetSavedSignature()
        {
            try
            {
                string signDirectory = Path.Combine(
                    Directory.GetCurrentDirectory(),
                    "wwwroot",
                    "signatures"
                );

                string filePath = Path.Combine(signDirectory, "sign.txt");

                if (!System.IO.File.Exists(filePath))
                {
                    return NotFound("Signature text file not found.");
                }

                // ✅ Read base64 (or full data URL) as text
                string signText = System.IO.File.ReadAllText(filePath);

            
                return Ok(new
                {
                    data = signText
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
    }
}
