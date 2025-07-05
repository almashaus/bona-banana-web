export function handlePrintOrder() {
  const dialog = document.querySelector('[role="dialog"]');
  if (!dialog) return;

  // Remove all <svg> elements from printContents
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = dialog.innerHTML;
  tempDiv.querySelectorAll("svg").forEach((el) => el.remove());
  const printContents = tempDiv.innerHTML;

  const printWindow = window.open("", "_blank", "width=900,height=700");
  if (!printWindow) return;
  printWindow.document.write(`
        <html>
          <head>
            <title>Order Details</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 24px; background: #f5f5f5; }
              .icon-saudi_riyal { font-family: Arial, sans-serif; }
              .bg-muted { background: #f3f4f6; }
              .rounded-lg { border-radius: 0.5rem; }
              .border { border: 1px solid #e5e7eb; }
              .font-bold { font-weight: bold; }
              .text-lg { font-size: 1.125rem; }
              .text-sm { font-size: 0.875rem; }
              .text-muted-foreground { color: #6b7280; }
              .text-orangeColor { color: #ff9800; }
              .text-redColor { color: #ef4444; }
              .badge { display: inline-block; padding: 0.25em 0.5em; border-radius: 0.25em; }
              .p-6 { padding-left: 24px ; padding-right: 24px; }
              .bg-card { margin-top: 16px; margin-bottom: 16px; }
              /* Add more minimal styles as needed */
            </style>
          </head>
          <body>
            ${printContents}
            <script>
              window.onload = function() {
                window.print();
                window.onafterprint = function() { window.close(); };
              };
            </script>
          </body>
        </html>
      `);
  printWindow.document.close();
}
