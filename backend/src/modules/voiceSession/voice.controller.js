import { emitToSession } from '../../services/socket.service.js';
import { speechToTextService } from '../../services/speechToText.service.js';
import { textToSpeechService } from '../../services/textToSpeech.service.js';
import { toPublicFileUrl } from '../../services/upload.service.js';
import { successResponse } from '../../utils/apiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { interviewSessionService } from '../../services/interviewSession.service.js';

export const voiceController = {
  answer: asyncHandler(async (req, res) => {
    emitToSession(req.params.sessionId, 'interview:thinking', { state: 'processing' });
    const transcript = req.body.transcript || req.body.fallbackText || (await speechToTextService.transcribe({ file: req.file })).transcript;
    const result = await interviewSessionService.processCandidateAnswer({
      sessionId: req.params.sessionId,
      user: req.user,
      transcript,
      audioUrl: toPublicFileUrl(req.file),
    });
    const normalizedType = result.questionType || result.aiResult?.questionType;
    const event = result.ended
      ? 'interview:ended'
      : normalizedType === 'followup'
        ? 'interview:followup'
        : normalizedType === 'clarification'
          ? 'interview:clarification'
          : 'interview:question';
    emitToSession(req.params.sessionId, event, result);
    if (result.ended && result.finalEvaluation) emitToSession(req.params.sessionId, 'interview:evaluation-ready', { sessionId: req.params.sessionId, finalEvaluation: result.finalEvaluation });
    return successResponse(res, { message: 'Answer processed', data: result });
  }),
  nextQuestion: asyncHandler(async (req, res) => {
    const session = await interviewSessionService.ensureOwnSession(req.params.sessionId, req.user);
    return successResponse(res, { data: { session } });
  }),
  transcribe: asyncHandler(async (req, res) => {
    const result = await speechToTextService.transcribe({ file: req.file, fallbackText: req.body.fallbackText });
    emitToSession(req.params.sessionId, 'transcription:completed', result);
    return successResponse(res, { data: result });
  }),
  speak: asyncHandler(async (req, res) => {
    const result = await textToSpeechService.synthesize({ text: req.body.text || 'Hello. Let us continue your interview.' });
    emitToSession(req.params.sessionId, 'ai:speaking', result);
    return successResponse(res, { data: result });
  }),
};
