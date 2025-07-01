import ezdxf
import os
import sys

def generate_dwg(width, height, depth):
    doc = ezdxf.new()
    msp = doc.modelspace()
    
    # Create a 2D box (or 3D in the future)
    msp.add_lwpolyline([(0, 0), (width, 0), (width, height), (0, height), (0, 0)])
    
    doc.audit()  # Fix DXF issues

    # Save as DXF
    save_path = os.path.join(os.getcwd(), "public", "dwgs", "building3.dxf")
    os.makedirs(os.path.dirname(save_path), exist_ok=True)

    doc.saveas(save_path)
    print(f"DXF saved at: {save_path}")

# ✅ Call function only when executed directly
if __name__ == "__main__":
    if len(sys.argv) < 4:
        print("Usage: python generate_dwg.py <width> <height> <depth>")
        sys.exit(1)

    # Read arguments from command line (sent by Next.js)
    width = float(sys.argv[1])
    height = float(sys.argv[2])
    depth = float(sys.argv[3])
    
    generate_dwg(width, height, depth)
