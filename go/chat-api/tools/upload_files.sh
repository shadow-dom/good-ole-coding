curl -X POST http://localhost:8080/upload \
  -F "files=@./test_1.txt" \
  -F "files=@./test_2.txt" \
  -F "files=@./test_large.txt" \
  -H "Content-Type: multipart/form-data"