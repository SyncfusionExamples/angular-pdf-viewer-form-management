//using Microsoft.AspNetCore.Mvc;
//using Microsoft.AspNetCore.Cors;
//using Microsoft.AspNetCore.Hosting;
//using Microsoft.AspNetCore.Http;
//using Microsoft.AspNetCore.Http.Features;
//using Newtonsoft.Json;
////using Syncfusion.EJ2.FileManager.Base;
////using Syncfusion.EJ2.FileManager.PhysicalFileProvider;
////using Syncfusion.EJ2.DocumentEditor;
////using Syncfusion.EJ2.Spreadsheet;
////using Syncfusion.XlsIO;
////using Syncfusion.XlsIORenderer;
//using System;
//using System.Collections.Generic;
//using System.IO;
//using System.Threading.Tasks;

//namespace EJ2APIServices.Controllers
//{
//    [Route("api/[controller]")]
//    [EnableCors("AllowAllOrigins")]
//    [ApiController]
//    public class FileManagerController : ControllerBase
//    {
//        //private readonly PhysicalFileProvider _operation;
//        private readonly string _basePath;
//        private readonly string _root = Path.Combine("wwwroot", "Files");

//        //public FileManagerController(IWebHostEnvironment hostingEnvironment)
//        //{
//        //    _basePath = hostingEnvironment.ContentRootPath;
//        //    _operation = new PhysicalFileProvider();
//        //    _operation.RootFolder(Path.Combine(_basePath, _root));
//        //}

//        //[HttpPost("FileOperations")]
//        //public object FileOperations([FromBody] FileManagerDirectoryContent args)
//        //{
//        //    if ((args.Action == "delete" || args.Action == "rename") && string.IsNullOrEmpty(args.TargetPath) && string.IsNullOrEmpty(args.Path))
//        //    {
//        //        return _operation.ToCamelCase(new FileManagerResponse
//        //        {
//        //            Error = new ErrorDetails
//        //            {
//        //                Code = "401",
//        //                Message = "Restricted to modify the root folder."
//        //            }
//        //        });
//        //    }

//        //    return args.Action switch
//        //    {
//        //        "read" => _operation.ToCamelCase(_operation.GetFiles(args.Path, args.ShowHiddenItems)),
//        //        "delete" => _operation.ToCamelCase(_operation.Delete(args.Path, args.Names)),
//        //        "copy" => _operation.ToCamelCase(_operation.Copy(args.Path, args.TargetPath, args.Names, args.RenameFiles, args.TargetData)),
//        //        "move" => _operation.ToCamelCase(_operation.Move(args.Path, args.TargetPath, args.Names, args.RenameFiles, args.TargetData)),
//        //        "details" => _operation.ToCamelCase(_operation.Details(args.Path, args.Names, args.Data)),
//        //        "create" => _operation.ToCamelCase(_operation.Create(args.Path, args.Name)),
//        //        "search" => _operation.ToCamelCase(_operation.Search(args.Path, args.SearchString, args.ShowHiddenItems, args.CaseSensitive)),
//        //        "rename" => _operation.ToCamelCase(_operation.Rename(args.Path, args.Name, args.NewName)),
//        //        _ => null
//        //    };
//        //}

//        //[HttpPost("Upload")]
//        //public IActionResult Upload(string path, IList<IFormFile> uploadFiles, string action)
//        //{
//        //    var uploadResponse = _operation.Upload(path, uploadFiles, action, null);
//        //    if (uploadResponse.Error != null)
//        //    {
//        //        Response.Clear();
//        //        Response.ContentType = "application/json; charset=utf-8";
//        //        Response.StatusCode = Convert.ToInt32(uploadResponse.Error.Code);
//        //        HttpContext.Features.Get<IHttpResponseFeature>().ReasonPhrase = uploadResponse.Error.Message;
//        //    }
//        //    return Content("");
//        //}

//        [HttpPost("Download")]
//        public IActionResult Download([FromBody] string downloadInput)
//        {
//            var args = JsonConvert.DeserializeObject<FileManagerDirectoryContent>(downloadInput);
//            return _operation.Download(args.Path, args.Names, args.Data);
//        }

//        [HttpPost("GetImage")]
//        public IActionResult GetImage([FromBody] FileManagerDirectoryContent args)
//        {
//            return _operation.GetImage(args.Path, args.Id, false, null, null);
//        }

//        [HttpPost("GetDocument")]
//        public string GetDocument([FromBody] CustomParams param)
//        {
//            string path = Path.Combine(_basePath, "wwwroot", "Files", param.FileName.Replace("/", Path.DirectorySeparatorChar.ToString()));

//            if (param.Action == "LoadPDF")
//            {
//                byte[] docBytes = System.IO.File.ReadAllBytes(path);
//                return "data:application/pdf;base64," + Convert.ToBase64String(docBytes);
//            }

//            try
//            {
//                using var stream = new FileStream(path, FileMode.Open, FileAccess.ReadWrite);
//                string extension = Path.GetExtension(param.FileName).ToLower();
//                WordDocument document = WordDocument.Load(stream, GetFormatType(extension));
//                string json = JsonConvert.SerializeObject(document);
//                document.Dispose();
//                return json;
//            }
//            catch
//            {
//                return "Failure";
//            }
//        }

//        private static FormatType GetFormatType(string format)
//        {
//            return format switch
//            {
//                ".dotx" or ".docx" or ".docm" or ".dotm" => FormatType.Docx,
//                ".dot" or ".doc" => FormatType.Doc,
//                ".rtf" => FormatType.Rtf,
//                ".txt" => FormatType.Txt,
//                ".xml" => FormatType.WordML,
//                ".html" => FormatType.Html,
//                _ => throw new NotSupportedException("EJ2 DocumentEditor does not support this file format."),
//            };
//        }

//        [HttpPost("GetExcel")]
//        public IActionResult GetExcel([FromBody] CustomParams param)
//        {
//            string fullPath = Path.Combine(_basePath, "wwwroot", "Files", param.FileName.Replace("/", Path.DirectorySeparatorChar.ToString()));
//            var fileStream = new FileStream(fullPath, FileMode.Open, FileAccess.Read);
//            return new FileStreamResult(fileStream, "application/octet-stream");
//        }

//        //[HttpPost("OpenExcel")]
//        //public IActionResult OpenExcel(IFormCollection openRequest)
//        //{
//        //    using var stream = openRequest.Files[0].OpenReadStream();
//        //    var formFile = new FormFile(stream, 0, stream.Length, "", openRequest.Files[0].FileName);
//        //    var open = new OpenRequest { File = formFile };
//        //    return Content(Workbook.Open(open));
//        //}

//        //[HttpPost("SaveExcel")]
//        //public IActionResult SaveExcel([FromBody] SaveSettings saveSettings)
//        //{
//        //    return Workbook.Save(saveSettings);
//        //}
//    }

//    public class CustomParams
//    {
//        public string FileName { get; set; }
//        public string Action { get; set; }
//    }
//}
