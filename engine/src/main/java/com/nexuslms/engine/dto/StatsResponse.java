package com.nexuslms.engine.dto;

// The totals shown on the admin dashboard. teachersPending is shown as a note under the teachers count.
public record StatsResponse(long classes, long teachers, long students, long courses, long teachersPending) {}