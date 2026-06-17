import fs from 'node:fs/promises';
import { PDFParse } from 'pdf-parse';
import { logger } from '../config/logger.js';
import { generateLlmJson, parseLlmJson } from './llm.service.js';

function stripCodeFences(text = '') {
  return text.replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();
}

function extractProjectBlocks(extractedText = '') {
  const lines = extractedText.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const projectStart = lines.findIndex((line) => /^projects?\b|academic projects|personal projects/i.test(line));
  if (projectStart < 0) return [];

  const sectionLines = [];
  for (const line of lines.slice(projectStart + 1)) {
    if (/^(experience|education|skills|certifications|achievements|contact)\b/i.test(line)) break;
    sectionLines.push(line);
  }

  const technologies = ['React', 'Node.js', 'Express', 'MongoDB', 'PostgreSQL', 'MySQL', 'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'Docker', 'AWS', 'Redis', 'Socket.io'];
  const blocks = sectionLines.join('\n').split(/\n(?=(?:[-*]\s*)?[A-Z][A-Za-z0-9 ._-]{2,80}(?:\s*[|:-]|$))/).slice(0, 5);
  return blocks.map((block) => {
    const clean = block.replace(/^[-*]\s*/, '').trim();
    const [firstLine, ...rest] = clean.split('\n');
    const name = firstLine.replace(/\s*[|:-].*$/, '').trim();
    const description = rest.join(' ').trim() || clean;
    const techStack = technologies.filter((tech) => new RegExp(`\\b${tech.replace(/[.+]/g, '\\$&')}\\b`, 'i').test(clean));
    return { name, description, techStack, keyAchievements: [] };
  }).filter((project) => project.name && project.name.length > 2);
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
    parsedProjects: extractProjectBlocks(extractedText),
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

async function structureWithLlm(extractedText) {
  if (!extractedText) return null;

  const raw = await generateLlmJson([
    'Parse this resume into JSON with keys parsedSkills, parsedProjects, parsedExperience, parsedEducation, parsedCertifications, parsedSummary.',
    'Projects must include name, techStack, description, and keyAchievements. Prefer projects that the candidate actually built.',
    'Experience must include company, role, duration, and description. Education must include institution, degree, and year.',
    'Return concise values only. Do not invent projects, employers, or skills.',
    extractedText.slice(0, 14000),
  ].join('\n\n'), {
    systemInstruction: 'Extract structured resume data. Return valid JSON only.',
    temperature: 0.2,
  });
  return parseLlmJson(stripCodeFences(raw), null);
}

export const resumeParserService = {
  async parse(file) {
    try {
      const extractedText = file?.mimetype === 'application/pdf'
        ? await extractPdfText(file.path)
        : (await fs.readFile(file.path, 'utf8')).trim();

      let aiStructure = null;
      try {
        aiStructure = await structureWithLlm(extractedText);
      } catch (error) {
        logger.warn('Resume LLM parsing unavailable; using local resume parser', { error: error.message });
      }
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
