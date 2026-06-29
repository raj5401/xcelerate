const generateCertificate = async (studentName, courseName, completionDate, score) => {
  // This would use a library like PDFKit to generate certificates
  // For now, returning a template
  const certificateCode = `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
  
  return {
    code: certificateCode,
    studentName,
    courseName,
    completionDate,
    score,
  }
}

const calculateProgress = (enrollmentData) => {
  const { videosWatched, totalVideos, testsAttempted, assignmentsSubmitted } = enrollmentData
  
  const videoProgress = totalVideos > 0 ? (videosWatched / totalVideos) * 50 : 0
  const assessmentProgress = ((testsAttempted + assignmentsSubmitted) / 10) * 50
  
  return Math.min(videoProgress + assessmentProgress, 100)
}

const calculateScorePercentile = (score, allScores) => {
  const belowScore = allScores.filter(s => s < score).length
  return Math.round((belowScore / allScores.length) * 100)
}

module.exports = {
  generateCertificate,
  calculateProgress,
  calculateScorePercentile,
}
