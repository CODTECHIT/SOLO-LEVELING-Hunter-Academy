import { Controller, Get, Param, UseGuards, Request } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CertificatesService } from "./certificates.service";

@Controller("certificates")
export class CertificatesController {
  constructor(private readonly certificatesService: CertificatesService) {}

  @UseGuards(JwtAuthGuard)
  @Get("course/:courseId")
  async getCertificateForCourse(
    @Request() req: any,
    @Param("courseId") courseId: string,
  ) {
    return this.certificatesService.getCertificateForCourse(
      req.user.userId,
      courseId,
    );
  }

  @Get("verify/:certificateNo")
  async verifyCertificate(@Param("certificateNo") certificateNo: string) {
    return this.certificatesService.verifyCertificate(certificateNo);
  }
}
