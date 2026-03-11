/**
 * syllabusMap.ts
 *
 * Static map from course ID → the imported syllabus JSON.
 * This avoids dynamic imports while keeping things simple for a client-only app.
 *
 * Courses in courses.json reference syllabus files via relative paths
 * (e.g. "./heat_and_mass_transfer_course.json"). We map using course ID (p1-p5).
 */

import type { CourseSyllabus } from "./types";

import heatMassTransfer from "@/data/heat_mass_transfer_course.json";
import controlSystems from "@/data/control_systems_course.json";
import dataStructures from "@/data/data_structures_course.json";
import microprocessor from "@/data/microprocessor_course.json";
import analyticalGeometry from "@/data/analytical_geometry_course.json";

export const syllabusMap: Record<string, CourseSyllabus> = {
  p1: heatMassTransfer as unknown as CourseSyllabus,
  p2: controlSystems as unknown as CourseSyllabus,
  p3: dataStructures as unknown as CourseSyllabus,
  p4: microprocessor as unknown as CourseSyllabus,
  p5: analyticalGeometry as unknown as CourseSyllabus,
};

/**
 * Get syllabus data for a course by its ID.
 * Returns null if the course has no associated syllabus JSON.
 */
export function getCourseSyllabus(courseId: string): CourseSyllabus | null {
  return syllabusMap[courseId] ?? null;
}
