import fs from 'node:fs/promises';
import { PDFParse } from 'pdf-parse';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

function stripCodeFences(text = '') {
  return text.replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();
}

function fallbackStructure(extractedText = '') {
  const skillsLine = extractedText.split(/\r?\n/).find((line) => /skills|technologies/i.test(line)) || '';
  const parsedSkills = skillsLine
    .replace(/skills|technologies|technical/gi, '')
    .split(/[,|;:]/)
    .map((item) => item.trim())
    .filter((item) => item.length > 1)
    .slice(0, 20);

  return {
    parsedSkills,
    parsedProjects: [],
    parsedExperience: [],
    parsedEducation: [],
    parsedCertifications: [],
    parsedSummary: extractedText.split(/\s+/).slice(0, 55).join(' '),
  };
}

async function extractPdfText(filePath) {
  const buffer = await fs.readFile(filePath);
  const parser = new PDFParse({ data: buffer });
  const parsed = await parser.getText();
  await parser.destroy?.();
  return (parsed.text || '').replace(/\n{3,}/g, '\n\n').trim();
}

async function structureWithAi(extractedText) {
  if (env.mockAi || !env.openaiApiKey || !extractedText) return null;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: env.interviewerModel,
      response_format: { type: 'json_object' },
      temperature: 0.2,
      messages: [
        {
          role: 'system',
          content: 'Extract structured resume data. Return valid JSON only.',
        },
        {
          role: 'user',
          content: [
            'Parse this resume into JSON with keys parsedSkills, parsedProjects, parsedExperience, parsedEducation, parsedCertifications, parsedSummary.',
            'Projects should include name, techStack, description, and keyAchievements.',
            'Experience should include company, role, duration, and description.',
            'Education should include institution, degree, and year.',
            extractedText.slice(0, 14000),
          ].join('\n\n'),
        },
      ],
    }),
  });

  if (!response.ok) throw new Error(`Resume AI parsing failed with status ${response.status}`);
  const data = await response.json();
  return JSON.parse(stripCodeFences(data.choices?.[0]?.message?.content || '{}'));
}

export const resumeParserService = {
  async parse(file) {
    try {
      const extractedText = file?.mimetype === 'application/pdf'
        ? await extractPdfText(file.path)
        : (await fs.readFile(file.path, 'utf8')).trim();

      const aiStructure = await structureWithAi(extractedText);
      const fallback = fallbackStructure(extractedText);
      return {
        extractedText,
        ...fallback,
        ...(aiStructure || {}),
        parsingStatus: 'completed',
        parsingError: null,
      };
    } catch (error) {
      logger.error('Resume parsing failed', { error: error.message, file: file?.originalname });
      return {
        extractedText: '',
        ...fallbackStructure(''),
        parsingStatus: 'failed',
        parsingError: error.message,
      };
    }
  },
};
