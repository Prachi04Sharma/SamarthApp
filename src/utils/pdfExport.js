import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

/**
 * Export AI analysis results to PDF
 * @param {Object} analysisData - The AI analysis data
 * @param {string} patientName - Patient name for the PDF
 * @returns {void} - Triggers a PDF download
 */
export const exportAiAnalysisToPdf = (analysisData, patientName = 'Patient') => {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const date = new Date().toLocaleDateString();
    
    // Document title
    doc.setFontSize(20);
    doc.setTextColor(0, 51, 102);
    doc.text('AI Neurological Assessment Report', pageWidth / 2, 20, { align: 'center' });
    
    // Document metadata
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`Patient: ${patientName}`, 20, 30);
    doc.text(`Date: ${date}`, 20, 37);
    doc.text(`Report ID: ${generateReportId()}`, 20, 44);
    
    // Overall assessment
    if (analysisData.overallAssessment) {
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text('Overall Assessment', 20, 55);
      
      doc.setFontSize(11);
      const splitText = doc.splitTextToSize(analysisData.overallAssessment, pageWidth - 40);
      doc.text(splitText, 20, 62);
    }
    
    // Conditions section - Parkinson's
    let yPos = doc.previousAutoTable ? doc.previousAutoTable.finalY + 15 : 80;
    addDisorderSection(doc, 'Parkinson\'s Disease Assessment', analysisData.parkinsonsDisease, yPos);
    
    // Conditions section - Bell's Palsy
    yPos = doc.previousAutoTable ? doc.previousAutoTable.finalY + 15 : doc.previousAutoTable.finalY + 10;
    addDisorderSection(doc, 'Bell\'s Palsy Assessment', analysisData.bellsPalsy, yPos);
    
    // Conditions section - ALS
    yPos = doc.previousAutoTable ? doc.previousAutoTable.finalY + 15 : doc.previousAutoTable.finalY + 10;
    addDisorderSection(doc, 'ALS Assessment', analysisData.als, yPos);
    
    // Disclaimer
    yPos = doc.previousAutoTable ? doc.previousAutoTable.finalY + 15 : doc.previousAutoTable.finalY + 10;
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    const disclaimer = analysisData.disclaimerNote || 
      "This is an automated AI analysis and should not replace professional medical diagnosis.";
    const splitDisclaimer = doc.splitTextToSize(disclaimer, pageWidth - 40);
    doc.text(splitDisclaimer, 20, yPos);
    
    // Save the document
    doc.save(`neurological_assessment_${formatForFilename(patientName)}_${formatDate()}.pdf`);
    
    console.log('AI Analysis PDF generated successfully');
    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    return false;
  }
};

/**
 * Add a disorder assessment section to the PDF
 * @param {Object} doc - jsPDF document instance
 * @param {string} title - Section title
 * @param {Object} data - Disorder data
 * @param {number} yPosition - Y position to start drawing
 */
function addDisorderSection(doc, title, data, yPosition) {
  if (!data) return;
  
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text(title, 20, yPosition);
  
  // Risk level
  const riskLevelText = `Risk Level: ${data.riskLevel?.toUpperCase() || 'Unknown'}`;
  const confidenceText = data.confidence ? `Confidence: ${data.confidence}%` : '';
  
  const tableData = [];
  
  // Add indicators
  if (data.indicators && data.indicators.length > 0) {
    tableData.push(['Indicators']);
    data.indicators.forEach(indicator => {
      tableData.push([`• ${indicator}`]);
    });
  }
  
  // Add recommendations
  if (data.recommendations && data.recommendations.length > 0) {
    tableData.push(['Recommendations']);
    data.recommendations.forEach(rec => {
      tableData.push([`• ${rec}`]);
    });
  }
  
  // Draw table
  doc.autoTable({
    startY: yPosition + 5,
    head: [[`${riskLevelText}    ${confidenceText}`]],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: data.riskLevel === 'high' ? [220, 53, 69] : 
                 data.riskLevel === 'moderate' ? [255, 193, 7] : 
                 [25, 135, 84],
      textColor: data.riskLevel === 'moderate' ? [0, 0, 0] : [255, 255, 255]
    },
    styles: {
      overflow: 'linebreak',
    },
    columnStyles: {
      0: { cellWidth: 'auto' }
    }
  });
}

// Helper functions
function generateReportId() {
  return 'R' + Math.random().toString(36).substring(2, 10).toUpperCase();
}

function formatDate() {
  const date = new Date();
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
}

function formatForFilename(text) {
  return text.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
}
