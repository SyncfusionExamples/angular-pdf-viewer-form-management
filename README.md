# Angular PDF Viewer Form Fields Management

## Overview

This sample demonstrates the following features in the Syncfusion PDF Viewer:

1. Save Signature to Server
   - Capture signature field values using the formFieldPropertiesChange event.
   - Send the signature data to a server and store it in a text file.

2. Retrieve and Apply Saved Signature
   - Fetch previously stored signature data from the server.
   - Programmatically populate signature fields in the PDF Viewer and update the values.

3. Redact Specific Form Fields
   - Locate target form fields using formFieldCollections.
   - Add redaction annotations over selected fields.
   - Permanently apply redaction using the redact() API.

4. Flatten Form Fields
   - Flatten specific form fields (for example, text boxes) using the Syncfusion PDF Library.
   - Reload the updated PDF into the viewer.

5. Export and Import Form Data
   - Export form field data in supported formats:
     - JSON
     - XFDF
     - FDF
     - JavaScript Object
   - Import previously exported form data into the PDF Viewer.

## Features Included

### Signature Storage
- Detects signature creation or modification.
- Sends signature data to the backend for persistence.

### Signature Retrieval
- Retrieves saved signature data.
- Updates matching signature fields automatically.

### Form Field Redaction
- Adds redaction marks over selected fields.
- Permanently removes sensitive content.

### Form Field Flattening
- Converts interactive fields into static PDF content.
- Prevents further editing.

### Form Data Export
Supported formats:
- JSON
- XFDF
- FDF
- JavaScript Object

## Prerequisites

- Angular
- Syncfusion EJ2 PDF Viewer
- Syncfusion EJ2 PDF Library
- Backend API (optional for signature storage)

## Typical Workflow

1. Load PDF document.
2. Fill form fields and sign.
3. Save signature to server.
4. Retrieve signature when needed.
5. Redact sensitive fields if required.
6. Flatten selected form fields.
7. Export form data or document.

## Use Cases

- Contract signing workflows
- Employee onboarding forms
- Insurance applications
- Government forms
- Compliance-driven document processing

## Notes

- Signature data can be stored as text in a server.
- Redaction permanently removes content from the PDF.
- Flattened fields cannot be edited afterward.
- Exported form data can be reused to populate the same PDF later.

This sample showcases end-to-end form field management, including signature persistence, redaction, flattening, and form data export/import within the Syncfusion PDF Viewer.
