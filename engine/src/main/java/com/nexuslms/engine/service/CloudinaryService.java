package com.nexuslms.engine.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Service
public class CloudinaryService {
    private final Cloudinary cloudinary;

    public CloudinaryService(Cloudinary cloudinary) {
        this.cloudinary = cloudinary;
    }

    public String uploadFile(MultipartFile file, String folder) throws IOException {
        String original = file.getOriginalFilename();
        String name = (original == null || original.isBlank()) ? "file" : original;

        // Cloudinary re-appends the extension for images and videos based on the actual
        // format, so we strip it there. For raw files (pdf, py, zip, docx…) it does not,
        // so we keep the original name including the extension.
        String contentType = file.getContentType();
        boolean isMedia = contentType != null
                && (contentType.startsWith("image/") || contentType.startsWith("video/"));

        String publicId = isMedia ? name.replaceAll("\\.[^.]+$", "") : name;
        publicId = publicId.replaceAll("[^a-zA-Z0-9._-]", "_");

        Map<?, ?> uploadResult = cloudinary.uploader().upload(
                file.getBytes(),
                ObjectUtils.asMap(
                        "folder", "nexuslms/" + folder,
                        "resource_type", "auto",
                        "public_id", publicId,
                        // If a file with the same name is uploaded twice, append _1, _2…
                        // instead of overwriting the earlier one.
                        "unique_filename", true
                )
        );
        return (String) uploadResult.get("secure_url");
    }

    public void deleteFile(String publicId) throws IOException {
        cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
    }
}