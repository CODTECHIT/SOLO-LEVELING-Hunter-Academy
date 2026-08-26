import { Controller, Get, Param, Query, Headers } from "@nestjs/common";
import { CoursesService } from "./courses.service";

@Controller("courses")
export class CoursesController {
  constructor(private coursesService: CoursesService) {}

  @Get()
  async findAll(@Query("skip") skip = "0", @Query("take") take = "10") {
    return this.coursesService.findAll(parseInt(skip), parseInt(take));
  }

  @Get("categories")
  async getCategories() {
    return this.coursesService.getCategories();
  }

  @Get("search")
  async search(
    @Query("q") query: string,
    @Query("skip") skip = "0",
    @Query("take") take = "10",
  ) {
    return this.coursesService.searchCourses(
      query,
      parseInt(skip),
      parseInt(take),
    );
  }

  @Get("catalog")
  async getCatalog() {
    return this.coursesService.getCatalog();
  }

  @Get("intro")
  async getIntroVideo() {
    return this.coursesService.getIntroVideo();
  }

  @Get(":id")
  async findById(
    @Param("id") id: string,
    @Headers("authorization") authHeader?: string,
  ) {
    let userId = null;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      try {
        const payload = await this.coursesService.verifyToken(token);
        userId = payload.sub;
      } catch (e) {
        // invalid token, ignore
      }
    }
    return this.coursesService.findById(id, userId);
  }

  @Get("slug/:slug")
  async findBySlug(
    @Param("slug") slug: string,
    @Headers("authorization") authHeader?: string,
  ) {
    let userId = null;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      try {
        const payload = await this.coursesService.verifyToken(token);
        userId = payload.sub; // JWT stores user ID in 'sub'
      } catch (e) {
        // invalid token, ignore
      }
    }
    return this.coursesService.findBySlugWithContext(slug, userId);
  }
}
