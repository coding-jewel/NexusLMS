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

        String contentType = file.getContentType();
        
        // FIXED: Treat PDFs as media so Cloudinary handles the extension correctly
        boolean isMedia = contentType != null
                && (contentType.startsWith("image/") || 
                    contentType.startsWith("video/") || 
                    contentType.equals("application/pdf"));

        // Strip the extension for media/PDFs, keep it for true raw files (like .zip, .py)
        String publicId = isMedia ? name.replaceAll("\\.[^.]+$", "") : name;
        
        // Sanitize the name
        publicId = publicId.replaceAll("[^a-zA-Z0-9._-]", "_");

        Map<?, ?> uploadResult = cloudinary.uploader().upload(
                file.getBytes(),
                ObjectUtils.asMap(
                        "folder", "nexuslms/" + folder,
                        "resource_type", "auto",
                        "public_id", publicId,
                        "unique_filename", true
                )
        );
        return (String) uploadResult.get("secure_url");
    }

    public void deleteFile(String publicId) throws IOException {
        cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
    }
}