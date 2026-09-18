import { Component, ViewEncapsulation, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  PdfViewerComponent,
  LinkAnnotationService,
  BookmarkViewService,
  MagnificationService,
  ThumbnailViewService,
  ToolbarService,
  NavigationService,
  TextSearchService,
  TextSelectionService,
  PrintService,
  AnnotationService,
  FormFieldsService,
  FormDesignerService,
  PageOrganizerService,
  PdfViewerModule,
  SignatureType,
  FormFieldDataFormat,
} from '@syncfusion/ej2-angular-pdfviewer';
import { PdfDocument, PdfField, PdfTextBoxField } from '@syncfusion/ej2-pdf';
/**
 * Default PdfViewer Controller
 */
@Component({
  selector: 'app-root',
  templateUrl: 'app.html',
  encapsulation: ViewEncapsulation.None,
  // tslint:disable-next-line:max-line-length
  providers: [
    LinkAnnotationService,
    BookmarkViewService,
    MagnificationService,
    ThumbnailViewService,
    ToolbarService,
    NavigationService,
    TextSearchService,
    TextSelectionService,
    PrintService,
    AnnotationService,
    FormFieldsService,
    FormDesignerService,
    PageOrganizerService,
  ],
  styleUrls: ['app.css'],
  standalone: true,
  imports: [CommonModule, PdfViewerModule],
})
export class App {
  @ViewChild('pdfviewer')
  public pdfviewerControl?: PdfViewerComponent;

  constructor(private readonly changeDetectorRef: ChangeDetectorRef) {}

  public document: string = window.location.origin + '/Input.pdf';
  public resource: string = window.location.origin + '/ej2-pdfviewer-lib';
  public exportedData: any;
  public showBarcodeDialog = false;
  public isBarcodeLoading = false;
  public barcodeDialogJson = '';
  public toolbarSettings = {
    showTooltip: true,
    toolbarItems: [
      'OpenOption',
      'PageNavigationTool',
      'MagnificationTool',
      'PanTool',
      'SelectionTool',
      'SearchOption',
      'PrintOption',
      'DownloadOption',
      'UndoRedoTool',
      "RedactionEditTool",
      "AnnotationEditTool",
      'FormDesignerEditTool',
    ],
    annotationToolbarItems: [
      "HighlightTool",
      "UnderlineTool",
      "StrikethroughTool",
      "ColorEditTool",
      "OpacityEditTool",
      "AnnotationDeleteTool",
      "InkAnnotationTool",
      "ShapeTool",
      "StrokeColorEditTool",
      "StampAnnotationTool",
      "ThicknessEditTool",
      "FreeTextAnnotationTool",
      "FontFamilyAnnotationTool",
      "FontSizeAnnotationTool",
      "FontStylesAnnotationTool",
      "FontAlignAnnotationTool",
      "FontColorAnnotationTool",
      "CommentPanelTool",
    ],
    formDesignerToolbarItems: [
      "TextboxTool",
      "CheckBoxTool",
      "RadioButtonTool",
      "DropdownTool",
      "ListboxTool",
      "DrawSignatureTool",
      "DeleteTool",
    ],
  };
  ngOnInit(): void {
    // ngOnInit function
  }
  blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(reader.error);
      reader.onload = () => {
        const dataUrl: string = reader.result as string;
        const data: string = dataUrl.split(',')[1];
        resolve(data);
      };
      reader.readAsDataURL(blob);
    });
  }

  flattenFormFields(data: string) {
    if (!this.pdfviewerControl) return;
    const document: PdfDocument = new PdfDocument(data);
    for (let index = 0; index < document.form.count; index++) {
      const field: PdfField = document.form.fieldAt(index);
      if (field instanceof PdfTextBoxField) {
        //add specifc condition here before flattening the fields
        field.flatten = true;
      }
    }
    // If both annotations and form fields needs to be flattened, use
    // document.flatten = true
    var pdfData = document.save();
    this.pdfviewerControl.load(pdfData, '');
    document.destroy();
  }

  async handleFlattening(): Promise<void> {
    if (!this.pdfviewerControl) return;
    const blob: Blob = await this.pdfviewerControl.saveAsBlob();
    const data: string = await this.blobToBase64(blob);
    this.flattenFormFields(data);
  }

  markForRedaction(): void {
    if (!this.pdfviewerControl) return;
    const formFields = this.pdfviewerControl.formFieldCollections;

    if (!formFields || formFields.length === 0) {
      console.error('Form fields are not available in loaded PDF!');
      return;
    }

    for (let i = 0; i < formFields.length; i++) {
      const field: any = formFields[i];

      if (field && field.type === 'SignatureField') {
        const bounds: any = field.bounds;
        const pageNumber = field.pageIndex + 1; // PDF Viewer pages are usually 1-based

        if (bounds) {
          this.pdfviewerControl.annotation.addAnnotation('Redaction', {
            pageNumber,
            bound: {
              x: bounds.x ?? bounds.X,
              y: bounds.y ?? bounds.Y,
              width: bounds.width ?? bounds.Width,
              height: bounds.height ?? bounds.Height,
            },
          } as any);
        }
      }
    }
  }
  /** Permanently applies all redaction marks in the document. */
  applyRedaction(): void {
    if (!this.pdfviewerControl) return;
    this.pdfviewerControl.annotation.redact();
  }
  public formFieldPropertiesChange = (args: any): void => {
    const newValue: string | undefined = args?.newValue;
    if (!newValue) {
      return;
    }

    this.sendToServer(newValue);
  };

  updateSignatureField(): void {
    fetch('https://localhost:7255/pdfviewer/GetSavedSignature', {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error('Failed to fetch signature');
        }
        return res.json();
      })
      .then((data) => {
        if (!this.pdfviewerControl) return;
        var formFields = this.pdfviewerControl.formFieldCollections;
        if (!formFields || formFields.length === 0) {
          console.error('Form fields are not available in loaded PDF!');
          return;
        }
        for (var i = 0; i < formFields.length; i++) {
          var field = formFields[i];

          if (field && field.type === 'SignatureField') {
            field.value = data.data;
            field.signatureType = [SignatureType.Image];
            this.pdfviewerControl.updateFormFieldsValue(field);
          }
        }
      })
      .catch((err) => {
        console.error('Error fetching signature:', err);
      });
  }
  /* ------------------ Server Call ------------------ */

  public sendToServer = (base64Data: string): void => {
    fetch('https://localhost:7255/pdfviewer/SaveSignAsImage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data: base64Data }),
    })
      .then((res) => res.text())
      .then((response) => console.log('Server Response:', response))
      .catch((error) => console.error('Error sending image:', error));
  };

  exportObj(): void {
    if (!this.pdfviewerControl) return;
    this.pdfviewerControl.exportFormFieldsAsObject(FormFieldDataFormat.Json).then(data => {
      this.exportedData = data;
    });
  }

  importFromObject(): void {
    if (!this.pdfviewerControl) return;
    this.pdfviewerControl.importFormFields(this.exportedData, FormFieldDataFormat.Json);
  }

  /** Sends the currently loaded PDF to the server and shows the Barcode JSON in a popup dialog. */
  async extractBarcodes(): Promise<void> {
    if (!this.pdfviewerControl) return;

    this.showBarcodeDialog = false;
    this.isBarcodeLoading = true;
    this.lockBackgroundInteraction(true);

    try {
      const blob: Blob = await this.pdfviewerControl.saveAsBlob();
      const data: string = await this.blobToBase64(blob);

      const response = await fetch('https://localhost:7255/pdfviewer/ExtractBarcodes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ data }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      this.barcodeDialogJson = JSON.stringify(result, null, 2);
      this.showBarcodeDialog = true;
      this.lockBackgroundInteraction(true);
      setTimeout(() => {
        this.isBarcodeLoading = false;
        this.changeDetectorRef.detectChanges();
      });
    } catch (error) {
      console.error('Error extracting barcodes:', error);
      this.isBarcodeLoading = false;
      this.lockBackgroundInteraction(false);
    }
  }

  private lockBackgroundInteraction(lock: boolean): void {
    if (typeof document === 'undefined') {
      return;
    }

    document.body.style.overflow = lock ? 'hidden' : '';
  }

  private downloadBarcodeJson(): void {
    if (!this.barcodeDialogJson) {
      return;
    }

    const fileBlob = new Blob([this.barcodeDialogJson], { type: 'application/json' });
    const url = window.URL.createObjectURL(fileBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Output.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  closeBarcodeDialog(): void {
    this.showBarcodeDialog = false;
    this.lockBackgroundInteraction(false);
    this.downloadBarcodeJson();
  }

  copyBarcodeJson(): void {
    navigator.clipboard.writeText(this.barcodeDialogJson).catch((error) => {
      console.error('Copy failed:', error);
    });
  }
} /* ------------------ Constants ------------------ */

class FormConstants {
  static readonly SIGNATURE_CHECK_SELECTOR =
    '.e-pv-signature-apperance .e-icons.e-frame.e-check';
}
