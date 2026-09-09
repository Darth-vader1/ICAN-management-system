"""
Utility functions for report generation and export
"""
import csv
import io
from datetime import datetime
from decimal import Decimal

from django.http import HttpResponse
from openpyxl import Workbook
from openpyxl.styles import Font, Alignment, PatternFill
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.enums import TA_CENTER, TA_RIGHT


def export_to_csv(data, filename, headers=None):
    """
    Export data to CSV format
    
    Args:
        data: List of dictionaries or list of lists
        filename: Output filename
        headers: Optional list of header names
    
    Returns:
        HttpResponse with CSV content
    """
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = f'attachment; filename="{filename}"'
    
    writer = csv.writer(response)
    
    # Write headers
    if headers:
        writer.writerow(headers)
    elif data and isinstance(data[0], dict):
        writer.writerow(data[0].keys())
    
    # Write data
    for row in data:
        if isinstance(row, dict):
            writer.writerow(row.values())
        else:
            writer.writerow(row)
    
    return response


def export_to_excel(data, filename, sheet_name='Sheet1', headers=None, title=None):
    """
    Export data to Excel format with styling
    
    Args:
        data: List of dictionaries or list of lists
        filename: Output filename
        sheet_name: Name of the Excel sheet
        headers: Optional list of header names
        title: Optional report title
    
    Returns:
        HttpResponse with Excel content
    """
    wb = Workbook()
    ws = wb.active
    ws.title = sheet_name
    
    current_row = 1
    
    # Add title if provided
    if title:
        ws.merge_cells(f'A1:{chr(64 + len(headers or data[0].keys()))}1')
        title_cell = ws['A1']
        title_cell.value = title
        title_cell.font = Font(size=16, bold=True)
        title_cell.alignment = Alignment(horizontal='center', vertical='center')
        current_row = 3
    
    # Write headers
    header_fill = PatternFill(start_color='4472C4', end_color='4472C4', fill_type='solid')
    header_font = Font(color='FFFFFF', bold=True)
    
    if headers:
        for col_num, header in enumerate(headers, 1):
            cell = ws.cell(row=current_row, column=col_num)
            cell.value = header
            cell.fill = header_fill
            cell.font = header_font
            cell.alignment = Alignment(horizontal='center')
    elif data and isinstance(data[0], dict):
        for col_num, header in enumerate(data[0].keys(), 1):
            cell = ws.cell(row=current_row, column=col_num)
            cell.value = header
            cell.fill = header_fill
            cell.font = header_font
            cell.alignment = Alignment(horizontal='center')
    
    current_row += 1
    
    # Write data
    for row_data in data:
        if isinstance(row_data, dict):
            values = list(row_data.values())
        else:
            values = row_data
        
        for col_num, value in enumerate(values, 1):
            cell = ws.cell(row=current_row, column=col_num)
            
            # Handle different data types
            if isinstance(value, Decimal):
                cell.value = float(value)
                cell.number_format = '#,##0.00'
            elif isinstance(value, datetime):
                cell.value = value
                cell.number_format = 'yyyy-mm-dd hh:mm:ss'
            else:
                cell.value = value
        
        current_row += 1
    
    # Auto-adjust column widths
    for column in ws.columns:
        max_length = 0
        column_letter = column[0].column_letter
        for cell in column:
            try:
                if len(str(cell.value)) > max_length:
                    max_length = len(str(cell.value))
            except:
                pass
        adjusted_width = min(max_length + 2, 50)
        ws.column_dimensions[column_letter].width = adjusted_width
    
    # Save to response
    response = HttpResponse(
        content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
    response['Content-Disposition'] = f'attachment; filename="{filename}"'
    wb.save(response)
    
    return response


def export_to_pdf(data, filename, headers=None, title=None, orientation='portrait'):
    """
    Export data to PDF format
    
    Args:
        data: List of dictionaries or list of lists
        filename: Output filename
        headers: Optional list of header names
        title: Optional report title
        orientation: 'portrait' or 'landscape'
    
    Returns:
        HttpResponse with PDF content
    """
    buffer = io.BytesIO()
    
    # Set page size
    pagesize = A4 if orientation == 'portrait' else (A4[1], A4[0])
    doc = SimpleDocTemplate(buffer, pagesize=pagesize, topMargin=0.5*inch, bottomMargin=0.5*inch)
    
    elements = []
    styles = getSampleStyleSheet()
    
    # Add title
    if title:
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=18,
            textColor=colors.HexColor('#1a56db'),
            spaceAfter=20,
            alignment=TA_CENTER
        )
        elements.append(Paragraph(title, title_style))
        elements.append(Spacer(1, 0.3*inch))
    
    # Prepare table data
    table_data = []
    
    # Add headers
    if headers:
        table_data.append(headers)
    elif data and isinstance(data[0], dict):
        table_data.append(list(data[0].keys()))
    
    # Add data rows
    for row in data:
        if isinstance(row, dict):
            table_data.append([str(v) if v is not None else '' for v in row.values()])
        else:
            table_data.append([str(v) if v is not None else '' for v in row])
    
    # Create table
    table = Table(table_data)
    
    # Style the table
    table_style = TableStyle([
        # Header style
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#4472C4')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        
        # Data rows
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 9),
        ('ALIGN', (0, 1), (-1, -1), 'LEFT'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f3f4f6')]),
    ])
    
    table.setStyle(table_style)
    elements.append(table)
    
    # Add footer with generation date
    elements.append(Spacer(1, 0.3*inch))
    footer_style = ParagraphStyle(
        'Footer',
        parent=styles['Normal'],
        fontSize=8,
        textColor=colors.grey,
        alignment=TA_RIGHT
    )
    footer_text = f"Generated on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
    elements.append(Paragraph(footer_text, footer_style))
    
    # Build PDF
    doc.build(elements)
    
    # Get PDF content
    pdf = buffer.getvalue()
    buffer.close()
    
    response = HttpResponse(content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="{filename}"'
    response.write(pdf)
    
    return response


def format_currency(value):
    """Format decimal as currency"""
    if value is None:
        return '₦0.00'
    return f'₦{value:,.2f}'


def format_percentage(value):
    """Format decimal as percentage"""
    if value is None:
        return '0%'
    return f'{value:.1f}%'
