package com.nexuslms.engine.service;

import com.nexuslms.engine.models.Question;
import com.nexuslms.engine.models.Quiz;
import com.nexuslms.engine.repository.QuizRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class QuizService {

    private final QuizRepository quizRepository;

    public QuizService(QuizRepository quizRepository) {
        this.quizRepository = quizRepository;
    }

    public Quiz createQuiz(Quiz quiz) {
        return quizRepository.save(quiz);
    }

    public List<Quiz> getAllQuizzesByCourse(String courseId) {
        return quizRepository.findAllByCourseId(courseId);
    }

    public List<Quiz> getAllQuizzesByTenant(String tenantId) {
        return quizRepository.findAllByTenantId(tenantId);
    }

    public List<Quiz> getAllQuizzesByTeacher(String teacherId) {
        return quizRepository.findAllByTeacherId(teacherId);
    }

    public List<Quiz> getPublishedQuizzesByCourse(String courseId) {
        return quizRepository.findAllPublishedByCourseId(courseId);
    }

    public Optional<Quiz> getQuizById(String id) {
        return quizRepository.findById(id);
    }

    public Quiz addQuestion(String id, Question question) {
        Quiz quiz = quizRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Quiz not found"));
        quiz.getQuestions().add(question);
        return quizRepository.save(quiz);
    }

    public Quiz publishQuiz(String id) {
        Quiz quiz = quizRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Quiz not found"));
        quiz.setPublished(true);
        return quizRepository.save(quiz);
    }

    public Quiz addAttachment(String id, String fileUrl) {
        Quiz quiz = quizRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Quiz not found"));
        quiz.getAttachmentUrls().add(fileUrl);
        return quizRepository.save(quiz);
    }

    public void deleteQuiz(String id) {
        quizRepository.deleteById(id);
    }
}