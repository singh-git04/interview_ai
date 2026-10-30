import { createRequire } from "module"
import path from "path"
import { pathToFileURL } from "url"
import { PDFParse } from "pdf-parse"
import { generateInterviewReport, generateResumePdf } from "../services/ai.service.js"
import interviewReportModel from "../model/interviewReport.model.js"

const require = createRequire(import.meta.url)
let standardFontDataUrl = ""
try {
    const pdfjsDistPkg = require.resolve("pdfjs-dist/package.json")
    standardFontDataUrl = pathToFileURL(path.join(path.dirname(pdfjsDistPkg), "standard_fonts")).href + "/"
} catch {
    // fallback if pdfjs-dist resolution is not available
}

/**
 * @description Controller to generate interview report based on user self description, resume and job description.
 */
export async function generateInterViewReportController(req, res) {
    try {
        let resumeText = ""
        if (req.file && req.file.buffer) {
            const parser = new PDFParse({
                data: new Uint8Array(req.file.buffer),
                ...(standardFontDataUrl ? { standardFontDataUrl } : {})
            })
            const resumeContent = await parser.getText()
            resumeText = resumeContent.text || ""
        }

        const { selfDescription, jobDescription } = req.body

        if (!jobDescription) {
            return res.status(400).json({
                message: "Job description is required."
            })
        }

        const interViewReportByAi = await generateInterviewReport({
            resume: resumeText,
            selfDescription,
            jobDescription
        })

        const interviewReport = await interviewReportModel.create({
            user: req.user.id,
            resume: resumeText,
            selfDescription,
            jobDescription,
            ...interViewReportByAi,
            title: interViewReportByAi.title || "Interview Preparation Report"
        })

        res.status(201).json({
            message: "Interview report generated successfully.",
            interviewReport
        })
    } catch (error) {
        console.error("Error generating interview report:", error)
        res.status(500).json({
            message: error.message || "Failed to generate interview report."
        })
    }
}

/**
 * @description Controller to get interview report by interviewId.
 */
export async function getInterviewReportByIdController(req, res) {
    try {
        const { interviewId } = req.params

        const interviewReport = await interviewReportModel.findOne({ _id: interviewId, user: req.user.id })

        if (!interviewReport) {
            return res.status(404).json({
                message: "Interview report not found."
            })
        }

        res.status(200).json({
            message: "Interview report fetched successfully.",
            interviewReport
        })
    } catch (error) {
        console.error("Error fetching interview report:", error)
        res.status(500).json({
            message: error.message || "Failed to fetch interview report."
        })
    }
}

/** 
 * @description Controller to get all interview reports of logged in user.
 */
export async function getAllInterviewReportsController(req, res) {
    try {
        const interviewReports = await interviewReportModel
            .find({ user: req.user.id })
            .sort({ createdAt: -1 })
            .select("-resume -selfDescription -jobDescription -__v -technicalQuestions -behavioralQuestions -skillGaps -preparationPlan")

        res.status(200).json({
            message: "Interview reports fetched successfully.",
            interviewReports
        })
    } catch (error) {
        console.error("Error fetching all interview reports:", error)
        res.status(500).json({
            message: error.message || "Failed to fetch interview reports."
        })
    }
}

/**
 * @description Controller to generate resume PDF based on user self description, resume and job description.
 */
export async function generateResumePdfController(req, res) {
    try {
        const { interviewReportId } = req.params

        const interviewReport = await interviewReportModel.findById(interviewReportId)

        if (!interviewReport) {
            return res.status(404).json({
                message: "Interview report not found."
            })
        }

        const { resume, jobDescription, selfDescription } = interviewReport

        const pdfBuffer = await generateResumePdf({ resume, jobDescription, selfDescription })

        res.set({
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename=resume_${interviewReportId}.pdf`
        })

        res.send(pdfBuffer)
    } catch (error) {
        console.error("Error generating resume PDF:", error)
        res.status(500).json({
            message: error.message || "Failed to generate resume PDF."
        })
    }
}
