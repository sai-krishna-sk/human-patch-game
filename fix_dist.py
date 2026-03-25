import os

def fix_dist_paths(dist_directory):
    for root, dirs, files in os.walk(dist_directory):
        for file in files:
            if file.endswith(('.html', '.js', '.css')):
                path = os.path.join(root, file)
                try:
                    with open(path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    # Convert absolute paths to relative
                    # "/assets/ -> "./assets/
                    # "/src/ -> "./src/
                    
                    # More general replacement for strings in JS/HTML/CSS
                    new_content = content.replace('"/assets/', '"./assets/')
                    new_content = new_content.replace('\'/assets/', '\'./assets/')
                    new_content = new_content.replace('"/src/', '"./src/')
                    new_content = new_content.replace('\'/src/', '\'./src/')
                    new_content = new_content.replace('"/Dia_audio/', '"./Dia_audio/')
                    new_content = new_content.replace('\'/Dia_audio/', '\'./Dia_audio/')
                    
                    # Also handle CSS url(/assets/...)
                    new_content = new_content.replace('url(/assets/', 'url(./assets/')
                    
                    if new_content != content:
                        print(f"Fixed paths in build file: {path}")
                        with open(path, 'w', encoding='utf-8') as f:
                            f.write(new_content)
                except Exception as e:
                    print(f"Error processing {path}: {e}")

if __name__ == "__main__":
    project_root = r"c:\Users\terli\Documents\Gamethon\human-patch-game"
    fix_dist_paths(os.path.join(project_root, "dist"))
