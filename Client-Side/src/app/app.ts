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
  
  // Role-based signature storage
  public currentRole: string = 'nurse'; // 'nurse' or 'doctor'
  public nurseSignature: string = ''; // Stores nurse signature
  public doctorSignature: string = ''; // Stores doctor signature
  public roleSignatureFieldMap: Map<string, string> = new Map(); // Maps signature field names to roles
  public tileRendering = {
    enableTileRendering: false,
  };
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

  /**
   * Set the current role (nurse or doctor)
   * When switching roles, automatically enforces field locking:
   * - Fields belonging to other roles become read-only
   * - Fields belonging to current role become editable
   * @param role 'nurse' or 'doctor'
   */
  public setCurrentRole(role: string): void {
    this.currentRole = role;
    console.log(`Current role set to: ${role}`);
    
    // Enforce field locking based on role ownership
    this.enforceRoleBasedFieldLocking();
  }

  /**
   * Get the current role
   */
  public getCurrentRole(): string {
    return this.currentRole;
  }

  /**
   * Enforces role-based field locking
   * - Locks fields that belong to other roles
   * - Unlocks fields that belong to current role
   */
  private enforceRoleBasedFieldLocking(): void {
    if (!this.pdfviewerControl) return;

    const formFields = this.pdfviewerControl.formFieldCollections;
    if (!formFields || formFields.length === 0) {
      console.log('No form fields to lock/unlock');
      return;
    }

    for (let i = 0; i < formFields.length; i++) {
      const field = formFields[i];

      if (field && field.type === 'SignatureField' && field.name) {
        const fieldRole = this.roleSignatureFieldMap.get(field.name);
        let visibility;
        if (fieldRole) {
          // Field has role ownership
          if (fieldRole === this.currentRole) {
            // Field belongs to current role - make it editable
            visibility = 'visible';
            console.log(`✓ Field "${field.name}" unlocked for ${this.currentRole}`);
          } else {
            // Field belongs to different role - make it read-only
            visibility = 'hidden';
            console.log(`✗ Field "${field.name}" locked (belongs to ${fieldRole})`);
          }

          // Update the field to apply the changes
          this.pdfviewerControl.formDesignerModule.updateFormField(field, { visibility: visibility } as any);
        }
      }
    }
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
  /**
   * Handle form field property changes with role-based signature storage
   * Validates role ownership before saving signature
   * Stores signatures separately for nurse and doctor roles
   */
  public formFieldPropertiesChange = (args: any): void => {
    const newValue: string | undefined = args?.newValue;
    const field: any = args?.field;

    if (!newValue || !field || !field.name || args.isVisibilityChanged) {
      return;
    }

    const fieldRole = this.roleSignatureFieldMap.get(field.name);

    // Validate: Allow edit only if field is unassigned or belongs to current role
    if (fieldRole && fieldRole !== this.currentRole) {
      console.error(`⚠️ Unauthorized: Cannot edit field "${field.name}" - owned by ${fieldRole}. Current role: ${this.currentRole}`);

      this.pdfviewerControl?.updateFormFieldsValue(field);
      return;
    }

    // Store signature based on current role
    if (this.currentRole === 'nurse') {
      this.nurseSignature = newValue;
      console.log('✓ Nurse signature saved');
    } else if (this.currentRole === 'doctor') {
      this.doctorSignature = newValue;
      console.log('✓ Doctor signature saved');
    }

    // Always map/update the signature field to the current role
    this.roleSignatureFieldMap.set(field.name, this.currentRole);
    console.log(`✓ Field "${field.name}" mapped to role: ${this.currentRole}`);
    console.log(`✓ Current mappings:`, Array.from(this.roleSignatureFieldMap.entries()));

    // Send to server - only pass role (not fieldName)
    this.sendToServer(newValue, this.currentRole);

    // Update the collection to enforce role-based read-only status
    this.updateSignatureFieldsInCollection();
  };

  /**
   * Handle addSignature event - triggered when a signature is added to the PDF
   * Updates the role-based field mapping and enforces read-only status for other roles
   * @param args - AddSignatureEventArgs containing signature information
   */
  public onAddSignature = (args: any): void => {
    console.log(`✓ Signature added event triggered`);
    console.log(`✓ Signature details:`, args);

    // Get all form fields to find the signature field
    if (!this.pdfviewerControl) return;

    const formFields = this.pdfviewerControl.formFieldCollections;
    if (!formFields || formFields.length === 0) {
      console.log('No form fields in collection');
      return;
    }

    // Find signature fields and update the mapping
    for (let i = 0; i < formFields.length; i++) {
      const field = formFields[i];

      if (field && field.type === 'SignatureField' && field.name) {
        // Check if this field is already mapped
        const existingRole = this.roleSignatureFieldMap.get(field.name);

        if (!existingRole) {
          // New signature field - map it to current role
          this.roleSignatureFieldMap.set(field.name, this.currentRole);
          console.log(`✓ New signature field "${field.name}" mapped to role: ${this.currentRole}`);
        }
      }
    }

    // Update all signature fields collection to enforce role-based read-only status
    this.updateSignatureFieldsInCollection();
  };

  /**
   * Updates the read-only status of all signature fields based on role mapping
   * Prevents other roles from editing signatures that belong to different roles
   */
  private updateSignatureFieldsInCollection(): void {
    if (!this.pdfviewerControl) return;

    const formFields = this.pdfviewerControl.formFieldCollections;
    if (!formFields || formFields.length === 0) {
      return;
    }

    // Update all signature fields based on role mapping
    for (let i = 0; i < formFields.length; i++) {
      const field = formFields[i];

      if (field && field.type === 'SignatureField' && field.name) {
        const fieldRole = this.roleSignatureFieldMap.get(field.name);
        let visibility;
        if (fieldRole) {
          // Field has role ownership
          if (fieldRole === this.currentRole) {
            // Field belongs to current role - make it editable
            visibility = 'visible';
            console.log(`✓ Field "${field.name}" unlocked for ${this.currentRole}`);
          } else {
            // Field belongs to different role - make it read-only
            visibility = 'hidden';
            console.log(`✗ Field "${field.name}" locked (belongs to ${fieldRole})`);
          }

          // Apply changes to PDF viewer
          this.pdfviewerControl.formDesignerModule.updateFormField(field, { visibility: visibility} as any);
        }
      }
    }

    console.log(`✓ Collection updated. Field mappings:`, Array.from(this.roleSignatureFieldMap.entries()));
  }

  /**
   * Fill signature field with the current role's saved signature
   * Fetches the appropriate signature (nurse or doctor) from server
   * and fills all signature fields assigned to the current role
   */
  updateSignatureField(): void {
    fetch('https://localhost:7255/pdfviewer/GetSavedSignature', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ role: this.currentRole }),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error('Failed to fetch signature for role: ' + this.currentRole);
        }
        return res.json();
      })
      .then((data) => {
        if (!this.pdfviewerControl) return;

        const formFields = this.pdfviewerControl.formFieldCollections;
        if (!formFields || formFields.length === 0) {
          console.error('Form fields are not available in loaded PDF!');
          return;
        }

        // Store locally based on role
        if (this.currentRole === 'nurse') {
          this.nurseSignature = data.data;
          console.log('✓ Nurse signature loaded from server');
        } else if (this.currentRole === 'doctor') {
          this.doctorSignature = data.data;
          console.log('✓ Doctor signature loaded from server');
        }

        // Update only signature fields designated for the current role
        for (let i = 0; i < formFields.length; i++) {
          const field = formFields[i];

          if (field && field.type === 'SignatureField' && field.name) {
            const fieldRole = this.roleSignatureFieldMap.get(field.name);

            // Allow fill only if:
            // 1. Field has no role assigned (first time)
            // 2. Field already belongs to current role
            if (!fieldRole || fieldRole === this.currentRole) {
              field.value = data.data;
              field.signatureType = [SignatureType.Image];
              this.roleSignatureFieldMap.set(field.name, this.currentRole);
              this.pdfviewerControl.updateFormFieldsValue(field);
              console.log(`✓ ${this.currentRole}'s signature filled in field: "${field.name}"`);
            } else {
              this.pdfviewerControl.updateFormFieldsValue(field);
              console.log(`✗ Field "${field.name}" is read-only (belongs to ${fieldRole})`);
            }
          }
        }
      })
      .catch((err) => {
        console.error('✗ Error fetching signature:', err);
      });
  }
  /* ------------------ Server Call ------------------ */

  /**
   * Convert signature data (JSON path format or SVG) to base64 PNG data URL
   * Handles three formats:
   * 1. JSON path array: [{"command":"M","x":202,"y":62}, {"command":"L","x":202,"y":62}, ...]
   * 2. SVG string: "<svg>...</svg>"
   * 3. Already base64: "data:image/png;base64,..."
   * @param signatureData The signature data in any supported format
   * @returns base64 data URL format: data:image/png;base64,...
   */
  private convertSvgToBase64(signatureData: string): string {
    // Check if already in base64 format
    if (signatureData.startsWith('data:')) {
      console.log('✓ Data already in base64 format');
      return signatureData;
    }

    // Check if it's JSON path format (starts with '[')
    if (signatureData.startsWith('[')) {
      console.log('✓ Converting JSON path format to PNG base64...');
      try {
        const paths = JSON.parse(signatureData) as Array<{ command: string; x: number; y: number }>;
        
        // Create canvas
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          console.error('✗ Failed to get canvas context');
          return signatureData;
        }

        // Calculate bounds to set canvas size
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        
        for (const path of paths) {
          if (path.x !== undefined && path.y !== undefined) {
            minX = Math.min(minX, path.x);
            minY = Math.min(minY, path.y);
            maxX = Math.max(maxX, path.x);
            maxY = Math.max(maxY, path.y);
          }
        }

        // Add padding
        const padding = 10;
        const width = maxX - minX + padding * 2;
        const height = maxY - minY + padding * 2;

        canvas.width = Math.max(width, 100);
        canvas.height = Math.max(height, 100);

        // Fill background with white
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw signature strokes
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        let isDrawing = false;
        for (const path of paths) {
          const x = path.x - minX + padding;
          const y = path.y - minY + padding;

          if (path.command === 'M') {
            // Move command - start new path
            if (isDrawing) {
              ctx.stroke();
            }
            ctx.beginPath();
            ctx.moveTo(x, y);
            isDrawing = true;
          } else if (path.command === 'L') {
            // Line command - draw to point
            if (!isDrawing) {
              ctx.beginPath();
              ctx.moveTo(x, y);
              isDrawing = true;
            } else {
              ctx.lineTo(x, y);
            }
          }
        }

        // Finish drawing
        if (isDrawing) {
          ctx.stroke();
        }

        // Convert to base64
        const base64DataUrl = canvas.toDataURL('image/png');
        console.log('✓ JSON path converted to PNG base64');
        return base64DataUrl;
      } catch (error) {
        console.error('✗ Error parsing JSON path format:', error);
        return signatureData;
      }
    }

    // Check if it's SVG string format
    if (signatureData.startsWith('<svg') || signatureData.includes('<svg')) {
      console.log('✓ Converting SVG string to PNG base64...');
      
      // Create a canvas to convert SVG to PNG
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        console.error('✗ Failed to get canvas context');
        return signatureData;
      }

      // Create SVG blob
      const svgBlob = new Blob([signatureData], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(svgBlob);

      // Create image from SVG
      const img = new Image();
      img.onload = () => {
        // Set canvas size to match image
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Draw image on canvas
        ctx.drawImage(img, 0, 0);
        
        // Clean up
        URL.revokeObjectURL(url);
      };
      img.src = url;

      // Return canvas as base64 data URL
      const base64DataUrl = canvas.toDataURL('image/png');
      console.log('✓ SVG string converted to PNG base64');
      return base64DataUrl;
    }

    // If format not recognized, return as-is
    console.warn('⚠️ Unknown signature data format, sending as-is');
    return signatureData;
  }

  /**
   * Send signature data to server with role information
   * Converts SVG to base64 if needed, then saves the signature for the specified role
   * @param signatureData The signature data (SVG string, base64, or data URL)
   * @param role The role (nurse or doctor)
   */
  public sendToServer = (signatureData: string, role: string = ''): void => {
    // Convert SVG to base64 if needed
    const base64Data = this.convertSvgToBase64(signatureData);

    const payload = {
      data: base64Data,
      role: role || this.currentRole,
    };

    fetch('https://localhost:7255/pdfviewer/SaveSignAsImage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
      .then((res) => res.json())
      .then((response) => {
        console.log('✓ Signature saved successfully');
        console.log(`✓ Server Response:`, response);
        console.log(`✓ Signature for "${role || this.currentRole}" has been updated`);
      })
      .catch((error) => console.error('✗ Error saving signature:', error));
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
